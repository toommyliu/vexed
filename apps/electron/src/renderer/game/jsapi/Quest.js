class Quest {
	/**
	 * @param {QuestData} data
	 */
	constructor(data) {
		if (typeof data === "object") {
			data.QuestID = Number.parseInt(data.QuestID, 10);
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

	hasCompletedBefore() {
		const _q = Bot.getInstance().quests.resolve(this.id);
		if (!_q) {
			return false;
		}

		const slot = _q.data.iSlot;
		const value = _q.data.iValue;

		return slot < 0 || Bot.getInstance().flash.call("world.getQuestValue", slot) >= value;
	}
}

// TODO: finish
/**
 * @typedef {Object} QuestData
 */
