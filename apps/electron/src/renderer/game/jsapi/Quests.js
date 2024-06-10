class Quests {
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
		while (!this.tree.find((q) => q.id === questID)?.inProgress) {
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
		await bot.waitUntil(() => this.tree.find((q) => q.id === questID));
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

	/**
	 * Loads multiple quests at once
	 * @param {string|Array<string>} questIDs Quest IDs deliminated by a comma
	 * @returns {Promise<void>}
	 */
	async loadMultiple(questIDs) {
		let _questIDs = questIDs;
		if (Array.isArray(questIDs)) {
			_questIDs = questIDs.join(",");
		}

		this.bot.flash.call(window.swf.LoadQuests, _questIDs);
	}

	/**
	 * Resolves a Quest instance from the quest tree
	 * @param {number} questID
	 * @returns {Quest?}
	 */
	resolve(questID) {
		return this.tree.find((quest) => quest.id === questID);
	}
}
