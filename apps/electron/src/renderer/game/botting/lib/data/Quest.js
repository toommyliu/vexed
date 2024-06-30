class Quest {
	#data;

	constructor(data) {
		this.#data = data;
	}

	/**
	 * The ID of the quest.
	 * @returns {number}
	 */
	get id() {
		return this.#data.QuestID;
	}

	/**
	 * Whether the quest is in progress.
	 * @returns {boolean}
	 */
	get inProgress() {
		return Flash.call(swf.IsInProgress, this.id);
	}

	/**
	 * broken if quest is not loaded
	 * Whether the quest can be completed.
	 * @returns {boolean}
	 */
	get completable() {
		return Flash.call(swf.CanComplete, this.id);
	}

	/**
	 * Whether the quest is available.
	 * @returns {boolean}
	 */
	get available() {
		return Flash.call(swf.IsAvailable, this.id);
	}
}
