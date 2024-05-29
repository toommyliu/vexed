class Quests {
	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;
	}

	/**
	 * Gets all quests loaded in the client.
	 * @returns {Quest[]}
	 */
	get tree() {
		return this.bot.flash.call(window.swf.GetQuestTree)?.map((data) => new Quest(data)) ?? [];
	}

	/**
	 * Accepts a quest.
	 * @param {string} questID
	 * @returns {Promise<void>}
	 */
	async accept(questID) {
		const bot = Bot.getInstance();
		await bot.waitUntil(() => bot.world.isActionAvailable(GameAction.AcceptQuest));
		while (!this.tree.find(q => q.id === questID)?.inProgress) {
			bot.flash.call(window.swf.Accept, questID);
			await bot.sleep(1500);
		}
	}

	/**
	 * Loads a quest.
	 * @param {string} questID The quest id to load.
	 * @returns {Promise<void>}
	 */
	async load(questID) {
		const bot = Bot.getInstance();
		bot.flash.call(window.swf.LoadQuest, questID);
		await bot.waitUntil(() => this.tree.find(q => q.id === questID));
	}

	/**
	 * Completes a quest.
	 * @param {string} questID The quest id to complete.
	 * @param {number} [turnIns=1] The number of times to turn-in the quest.
	 * @param {number} [itemID=-1] The ID of the quest rewards to select.
	 * @returns {Promise<void>}
	 */
	async complete(questID, turnIns = 1, itemID = -1) {
		const bot = Bot.getInstance();
		if (itemID !== -1) {
			bot.flash.call(window.swf.Complete, questID, turnIns, itemID);
		} else {
			bot.flash.call(window.swf.Complete, questID, turnIns);
		}
	}
}

class Quest {
	/**
	 * @param {QuestData} data
	 */
	constructor(data) {
		if (typeof data === 'object') {
			// data from game
			this.data = data;
		} else if (typeof data === 'number' || typeof data === 'string') {
			// only quest id is known
			this.data = { QuestID: Number.parseInt(data, 10) };
		}
	}

	/**
	 * The ID of the quest.
	 * @returns {number}
	 */
	get id() {
		return this.data.QuestID;
	}

	/**
	 * Whether the quest is in progress.
	 * @returns {boolean}
	 */
	get inProgress() {
		return Bot.getInstance().flash.call(window.swf.IsInProgress, this.id);
	}

	/**
	 * broken if quest is not loaded
	 * Whether the quest can be completed.
	 * @returns {boolean}
	 */
	get completable() {
		return Bot.getInstance().quests.tree.find((q) => q.id === this.id)?.completable ?? false;
	}

	/**
	 * Whether the quest is available.
	 * @returns {boolean}
	 */
	get available() {
		return Bot.getInstance().flash.call(window.swf.IsAvailable, this.id) ?? false;
	}
}

// TODO: finish
/**
 * @typedef {Object} QuestData
 */