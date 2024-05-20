class Quests {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;
	}

	/**
	 * Gets all loaded quests.
	 * @returns {QuestData[]}
	 */
	get tree() {
		return this.instance.flash.call(window.swf.GetQuestTree);
	}
}

/**
 * Represents a quest.
 */
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
	 * Accepts the quest.
	 * @returns {Promise<void>}
	 */
	async accept() {
		const bot = Bot.getInstance();
		await bot.waitUntil(() => bot.world.isActionAvailable(GameAction.AcceptQuest));
		bot.flash.call(window.swf.Accept, this.id);
	}

	/**
	 * Completes the quest.
	 * @param {number} [quantity=1]
	 * @param {number} [itemId=-1]
	 * @returns {Promise<void>}
	 */
	async complete(quantity = 1, itemId = -1) {
		const bot = Bot.getInstance();
		await bot.waitUntil(() => bot.world.isActionAvailable(GameAction.TryQuestComplete));
		bot.flash.call(window.swf.Complete, this.id, quantity, itemId, itemId !== -1);
	}

	/**
	 * Loads the quest.
	 * @returns {Promise<void>}
	 */
	async load() {
		const bot = Bot.getInstance();
		bot.flash.call(window.swf.LoadQuest, this.id);
		await bot.sleep(1000);
		const _data = bot.quests.tree.find((q) => q.QuestID === this.id);
		if (_data)
			this.data = _data;
	}

	/**
	 * Whether the quest is in progress.
	 * @returns {boolean}
	 */
	get inProgress() {
		return Bot.getInstance().flash.call(window.swf.IsInProgress, this.id);
	}

	/**
	 * Whether the quest can be completed.
	 * @returns {boolean}
	 */
	get canComplete() {
		return Bot.getInstance().quests.tree.find((q) => q.id === this.id)?.canComplete ?? false;
		// return Bot.getInstance().flash.call(window.swf.CanComplete, this.id);
	}

	/**
	 * Whether the quest is available.
	 * @returns {boolean}
	 */
	get isAvailable() {
		return Bot.getInstance().flash.call(window.swf.IsAvailable, this.id);
	}
}

// TODO: finish
/**
 * @typedef {Object} QuestData
 */