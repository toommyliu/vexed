import Quest from './struct/Quest';
import type Bot from './Bot';
import { GameAction } from './World';

class Quests {
	public bot: Bot;

	constructor(bot: Bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Gets all quests loaded in the client.
	 * @returns {Quest[]}
	 */
	public get tree(): Quest[] {
		const ret = this.bot.flash.call(swf.GetQuestTree);
		if (Array.isArray(ret)) {
			return ret.map((data) => new Quest(data));
		}
		return [];
	}

	/**
	 * Gets all accepted quests.
	 * @returns {Quest[]}
	 */
	public get accepted(): Quest[] {
		return this.tree.filter((q) => q.inProgress);
	}

	/**
	 * Loads a quest(s).
	 * @param {string|number|string[]|number[]} questID The quest id(s) to load. If using a string, it must be comma-separated.
	 * @returns {Promise<void>}
	 */
	// TODO: return whether quests were accepted
	public async load(
		questID: string | number | string[] | number[],
	): Promise<void> {
		let quests = [];
		if (typeof questID === 'string') {
			if (!questID.includes(',')) {
				// single quest
				quests = this.#parseQuestID(questID);
			} else {
				// csv
				Array.prototype.push.apply(
					quests,
					questID.split(',').map((s) => s.trim()),
				);
			}
		} else if (typeof questID === 'number') {
			// single quest
			quests.push(questID);
		} else if (Array.isArray(questID)) {
			// multiple quests
			quests.concat(questID);
		}

		for (const questID of quests) {
			while (!this.get(questID)) {
				this.bot.flash.call(swf.LoadQuest, questID);
				await this.bot.waitUntil(
					() => this.get(questID),
					() => this.bot.auth.loggedIn && this.bot.player.isLoaded(),
				);
			}
		}
	}

	/**
	 * Accepts a quest(s)
	 * @param {string|number|string[]|number[]} questID The quest id(s) to accept. If using a string, it must be comma-separated.
	 * @returns {Promise<void>}
	 */
	// TODO: return whether quests were accepted
	public async accept(questID) {
		let quests = [];
		if (typeof questID === 'string') {
			if (!questID.includes(',')) {
				// single quest
				quests = this.#parseQuestID(questID);
			} else {
				// csv
				Array.prototype.push.apply(
					quests,
					questID.split(',').map((s) => s.trim()),
				);
			}
		} else if (typeof questID === 'number') {
			// single quest
			quests.push(questID);
		} else if (Array.isArray(questID)) {
			// multiple quests
			quests.concat(questID);
		}

		for (const questID of quests) {
			await this.bot.waitUntil(() =>
				this.bot.world.isActionAvailable(GameAction.AcceptQuest),
			);

			await this.load(questID);
			this.bot.flash.call(swf.Accept, questID);
			await this.bot.waitUntil(() => this.get(questID)?.inProgress);
		}
	}

	/**
	 * Completes a quest.
	 * @param {string} questID The quest id to complete.
	 * @param {number} [turnIns=1] The number of times to turn-in the quest.
	 * @param {number} [itemID=-1] The ID of the quest rewards to select.
	 * @returns {Promise<void>}
	 */
	public async complete(questID: string | number, turnIns = 1, itemID = -1) {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.TryQuestComplete),
		);

		if (itemID !== -1) {
			this.bot.flash.call(
				swf.Complete,
				String(questID),
				turnIns,
				String(itemID),
			);
		} else {
			this.bot.flash.call(swf.Complete, String(questID), String(itemID));
		}
	}

	/**
	 * Resolves a Quest instance from the quest tree
	 * @param {string|number} questKey The name or questID to get.
	 * @returns {Quest?}
	 */
	public get(questKey: string | number): Quest | undefined {
		if (typeof questKey === 'string') {
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
			}) ?? undefined
		);
	}

	/**
	 * @param {string|number} questKey
	 * @returns {number}
	 */
	#parseQuestID(questKey: string | number): number {
		if (typeof questKey === 'string') {
			return Number.parseInt(questKey, 10);
		}

		return questKey;
	}
}

export default Quests;
