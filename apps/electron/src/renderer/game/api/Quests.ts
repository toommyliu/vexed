import type { Bot } from './Bot';
import { GameAction } from './World';
import { Quest, type QuestData } from './struct/Quest';

export class Quests {
	public constructor(public bot: Bot) {}

	/**
	 * Gets all quests loaded in the client.
	 */
	public get tree(): Quest[] {
		const ret = this.bot.flash.call(() => swf.GetQuestTree());
		return Array.isArray(ret)
			? ret.map((data) => new Quest(data as unknown as QuestData))
			: [];
	}

	/**
	 * Gets all accepted quests.
	 */
	public get accepted(): Quest[] {
		return this.tree.filter((quest) => quest.inProgress);
	}

	/**
	 * Resolves a Quest instance from the quest tree
	 *
	 * @param questId - The id of the quest.
	 */
	public get(questId: number | string): Quest | null {
		if (typeof questId === 'string') {
			return (
				this.tree.find((quest) => String(quest.id) === questId) ?? null
			);
		} else if (typeof questId === 'number') {
			return this.tree.find((quest) => quest.id === questId) ?? null;
		}

		return null;
	}

	/**
	 * Loads a quest(s).
	 *
	 * @param questIds - The quest id(s) to load.
	 */
	public async load(
		questIds: number[] | string[] | number | string,
	): Promise<void> {
		const ids = this.normalizeQuestIds(questIds);

		await Promise.all(
			ids.map(async (id) => {
				while (!this.get(id)) {
					// eslint-disable-next-line @typescript-eslint/no-loop-func
					this.bot.flash.call(() => swf.LoadQuest(id));
					await this.bot.waitUntil(
						() => this.get(id) !== null,
						() => this.bot.player.isReady(),
					);
				}
			}),
		);
	}

	/**
	 * Accepts a quest(s)
	 *
	 * @param questIds - The quest id(s) to accept. If using a string, it must be comma-separated.
	 * @returns - Promise<void>
	 */
	public async accept(
		questIds: number[] | string[] | number | string,
	): Promise<void> {
		const ids = this.normalizeQuestIds(questIds);

		await Promise.all(
			ids.map(async (id) => {
				while (!this.get(id)) {
					// eslint-disable-next-line @typescript-eslint/no-loop-func
					this.bot.flash.call(() => swf.LoadQuest(id));
					await this.bot.sleep(250);
				}

				await this._accept(id);
			}),
		);
	}

	/**
	 * Completes a quest.
	 *
	 * @param questId - The quest id to complete.
	 * @param turnIns - The number of times to turn-in the quest.
	 * @param itemId - The ID of the quest rewards to select.
	 * @param special - Whether the quest is "special."
	 */
	public async complete(
		questId: number | string,
		turnIns = 1,
		itemId = -1,
		special = false,
	) {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.TryQuestComplete),
		);

		this.bot.flash.call(() => {
			swf.Complete(
				String(questId),
				turnIns,
				String(itemId),
				special === true ? 'True' : 'False',
			);
		});
	}

	/**
	 * @param questId - The quest to accept.
	 * @returns Promise<void>
	 */
	private async _accept(questId: string): Promise<void> {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.AcceptQuest),
		);

		await this.load(questId);
		await this.bot.flash.call(() => swf.Accept(questId));
		await this.bot.waitUntil(() => this.get(questId)?.inProgress ?? false);
	}

	private normalizeQuestIds(
		questIds: number[] | string[] | number | string,
	): string[] {
		if (Array.isArray(questIds)) {
			return questIds.map(String);
		} else if (typeof questIds === 'string') {
			return questIds.includes(',')
				? questIds.split(',').map((id) => id.trim())
				: [questIds];
		} else if (typeof questIds === 'number') {
			return [String(questIds)];
		} else {
			return [];
		}
	}
}
