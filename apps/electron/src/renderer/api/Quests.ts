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
		if (Array.isArray(ret)) {
			return ret.map((data) => new Quest(data as unknown as QuestData));
		}

		return [];
	}

	/**
	 * Gets all accepted quests.
	 */
	public get accepted(): Quest[] {
		return this.tree.filter((quest) => quest.inProgress);
	}

	/**
	 * Loads a quest(s).
	 *
	 * @param questID - The quest id(s) to load.
	 */
	public async load(
		questID: number[] | string[] | number | string,
	): Promise<void> {
		const quests: string[] = this.parseQuestIDs(questID);

		for (const questID of quests) {
			while (!this.get(questID)) {
				// eslint-disable-next-line @typescript-eslint/no-loop-func
				this.bot.flash.call(() => swf.LoadQuest(questID));
				await this.bot.waitUntil(
					() => this.get(questID) !== null,
					() => this.bot.player.isReady(),
				);
			}
		}
	}

	/**
	 * Accepts a quest(s)
	 *
	 * @param questID - The quest id(s) to accept. If using a string, it must be comma-separated.
	 */
	public async accept(
		questID: number[] | string[] | number | string,
	): Promise<boolean> {
		const quests = this.parseQuestIDs(questID);

		for (const questID of quests) {
			await this.bot.waitUntil(() =>
				this.bot.world.isActionAvailable(GameAction.AcceptQuest),
			);
			await this.load(questID);
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			await this.bot.flash.call(() => swf.Accept(questID));
			await this.bot.waitUntil(
				() => this.get(questID)?.inProgress ?? false,
			);
		}

		return true;
	}

	/**
	 * Completes a quest.
	 *
	 * @param questID - The quest id to complete.
	 * @param turnIns - The number of times to turn-in the quest.
	 * @param itemID - The ID of the quest rewards to select.
	 */
	public async complete(questID: number | string, turnIns = 1, itemID = -1) {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.TryQuestComplete),
		);

		if (itemID === -1) {
			this.bot.flash.call(() =>
				swf.Complete(String(questID), turnIns, '-1', 'False'),
			);
		} else {
			this.bot.flash.call(() =>
				swf.Complete(String(questID), turnIns, String(itemID), 'False'),
			);
		}
	}

	/**
	 * Resolves a Quest instance from the quest tree
	 *
	 * @param questKey - The name or questID to get.
	 */
	public get(questKey: number | string): Quest | null {
		if (typeof questKey === 'string') {
			// eslint-disable-next-line no-param-reassign
			questKey = questKey.toLowerCase();
		}

		return (
			this.tree.find((quest) => {
				if (typeof questKey === 'string') {
					return quest.name.toLowerCase() === questKey;
				}

				if (typeof questKey === 'number') {
					return quest.id === questKey;
				}

				return undefined;
			}) ?? null
		);
	}

	private parseQuestIDs(
		questID: number[] | string[] | number | string,
	): string[] {
		if (Array.isArray(questID)) {
			return questID.map(String);
		} else if (typeof questID === 'string') {
			return questID.includes(',')
				? questID.split(',').map((id) => id.trim())
				: [questID];
		} else if (typeof questID === 'number') {
			return [String(questID)];
		} else {
			return [];
		}
	}
}
