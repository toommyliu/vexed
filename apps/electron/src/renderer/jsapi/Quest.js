class Quest {
	/**
	 * @param {QuestData} data
	 */
	constructor(data) {
		if (typeof data === "object") {
			// data from game
			this.data = data;
		} else if (typeof data === "number" || typeof data === "string") {
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
		return Bot.getInstance().flash.call(window.swf.CanComplete, this.id) ?? false;
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
