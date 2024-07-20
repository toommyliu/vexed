const Quest = require('./struct/Quest');

class Quests {
	constructor(bot) {
		/**
		 * @type {import('./Bot')}
		 */
		this.bot = bot;
	}

	/**
	 * Gets all quests loaded in the client.
	 * @returns {Quest[]}
	 */
	get tree() {
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
	get accepted() {
		return this.tree.filter((q) => q.inProgress);
	}

	/**
	 * Loads a quest.
	 * @param {string|number} questID The quest id to load.
	 * @returns {Promise<void>}
	 */
	async load(questID) {
		questID = this.#parseQuestID(questID);

		while (!this.get(questID)) {
			this.bot.flash.call(swf.LoadQuest, questID);
			await this.bot.waitUntil(
				() => this.get(questID),
				() => this.bot.auth.loggedIn && this.bot.player.loaded,
			);
		}
	}

	/**
	 * Accepts a quest.
	 * @param {string|number} questID The quest id to accept.
	 * @returns {Promise<boolean>} Whether the quest was accepted and is now in progress.
	 */
	async accept(questID) {
		questID = this.#parseQuestID(questID);

		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.AcceptQuest),
		);

		await this.load(questID);
		this.bot.flash.call(swf.Accept, questID);
		await this.bot.waitUntil(() => this.get(questID)?.inProgress);
	}

	/**
	 * Accepts multiple quests at once
	 * @param {string|string[]|number|number[]} questIDs The quest ids.
	 * @returns {Promise<void>}
	 */
	async acceptMultiple(questIDs) {
		// to accept
		let out = [];

		if (typeof questIDs === 'string') {
			out = questIDs.split(',').map((s) => s.trim());
		} else if (Array.isArray(questIDs)) {
			out = questIDs;
		}

		for (const questID of out) {
			await this.accept(questID);
		}
	}

	/**
	 * Completes a quest.
	 * @param {string} questID The quest id to complete.
	 * @param {number} [turnIns=1] The number of times to turn-in the quest.
	 * @param {number} [itemID=-1] The ID of the quest rewards to select.
	 * @returns {Promise<void>}
	 */
	async complete(questID, turnIns = 1, itemID = -1) {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.TryQuestComplete),
		);

		if (itemID !== -1) {
			this.bot.flash.call(swf.Complete, questID, turnIns, itemID);
		} else {
			this.bot.flash.call(swf.Complete, questID, turnIns);
		}
	}

	/**
	 * Loads multiple quests at once
	 * @param {string|Array<string>} questIDs The quest ids
	 * @returns {Promise<void>}
	 */
	async loadMultiple(questIDs) {
		if (Array.isArray(questIDs)) {
			questIDs = questIDs.join(',');
		}

		this.bot.flash.call(swf.LoadQuests, questIDs);
	}

	/**
	 * Resolves a Quest instance from the quest tree
	 * @param {string|number} questKey The name or questID to get
	 * @returns {Quest?}
	 */
	get(questKey) {
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
			}) ?? null
		);
	}

	/**
	 * @param {string|number} questKey
	 * @returns {number}
	 */
	#parseQuestID(questKey) {
		if (typeof questKey === 'string') {
			return Number.parseInt(questKey, 10);
		}

		return questKey;
	}
}

module.exports = Quests;
