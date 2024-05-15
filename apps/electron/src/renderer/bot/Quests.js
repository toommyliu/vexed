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
	 * @returns {Quest[]}
	 */
	get tree() {
		return this.instance.flash.call(window.swf.GetQuestTree)?.map((data) => new Quest(data)) ?? [];
	}
}

class Quest {
	/**
	 * @param {QuestData} data
	 */
	constructor(data) {
		if (typeof data === 'number' || typeof data === 'string') {
			data = { QuestID: Number.parseInt(data, 10) };
		}
		this.data = data;
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
	 * @returns {void}
	 */
	accept() {
		Bot.getInstance().flash.call(window.swf.Accept, this.id);
	}

	/**
	 * Completes the quest.
	 * @param {number} [quantity=1]
	 * @returns {void}
	 */
	complete(quantity = 1) {
		Bot.getInstance().flash.call(window.swf.Complete, this.id, quantity);
	}

	/**
	 * Loads the quest.
	 * @returns {void}
	 */
	load() {
		Bot.getInstance().flash.call(window.swf.LoadQuest, this.id);
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
		return Bot.getInstance().flash.call(window.swf.CanComplete, this.id);
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
