import type { Bot } from './Bot';
import { GameAction } from './World';
import { Quest, type QuestData } from './struct/Quest';

export class Quests {
	public constructor(public bot: Bot) {}

	/**
	 * A list of quests loaded in the client.
	 */
	public get tree(): Quest[] {
		const ret = this.bot.flash.call(() => swf.GetQuestTree());
		return Array.isArray(ret)
			? ret.map((data: QuestData) => new Quest(data))
			: [];
	}

	/**
	 * A list of accepted quests.
	 */
	public get accepted(): Quest[] {
		return this.tree.filter((quest) => quest.inProgress);
	}

	/**
	 * Resolves for a Quest instance.
	 *
	 * @param questId - The id of the quest.
	 */
	public get(questId: number | string): Quest | null {
		const id = String(questId);
		return this.tree.find((quest) => String(quest.id) === id) ?? null;
	}

	/**
	 * Loads a quest.
	 *
	 * @param questId - The quest id to load.
	 */
	public async load(questId: number | string): Promise<void> {
		const id = String(questId);
		if (this.get(id)) return;

		await this.bot.flash.call(() => swf.LoadQuest(id));
		await this.bot.waitUntil(() => this.get(id) !== null, null, 5);
	}

	/**
	 * Loads multiple quests at once.
	 *
	 * @param questIds - List of quest ids to load
	 * @returns Promise<void>
	 */
	public async loadMultiple(questIds: (number | string)[]): Promise<void> {
		if (!Array.isArray(questIds) || !questIds.length) return;

		await Promise.all(questIds.map(async (id) => this.load(id)));
	}

	/**
	 * Accepts a quest.
	 *
	 * @param questId - The quest id to accept.
	 * @returns Promise<void>
	 */
	public async accept(questId: number | string): Promise<void> {
		const id = String(questId);

		if (!this.get(id)) await this.load(id);

		// Ensure the quest is ready to be accepted
		if (this.get(id)?.inProgress)
			await this.bot.waitUntil(() => !this.get(id)?.inProgress, null, 3);

		await this.bot.waitUntil(
			() => this.bot.world.isActionAvailable(GameAction.AcceptQuest),
			null,
			3,
		);

		this.bot.flash.call(() => swf.Accept(id));
		await this.bot.waitUntil(
			() => Boolean(this.get(id)?.inProgress),
			null,
			3,
		);
		console.log(`${id}: ${this.get(id)?.inProgress}`);
	}

	/**
	 * Accepts multiple quests concurrently.
	 *
	 * @param questIds - List of quest ids to accept.
	 * @returns Promise<void>
	 */
	public async acceptMultiple(questIds: (number | string)[]): Promise<void> {
		if (!Array.isArray(questIds) || !questIds.length) return;

		await Promise.all(questIds.map(async (id) => this.accept(id)));
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

		if (!this.get(questId)?.canComplete()) return;

		this.bot.flash.call(() => {
			swf.Complete(
				String(questId),
				turnIns,
				String(itemId),
				special === true ? 'True' : 'False',
			);
		});
	}
}
