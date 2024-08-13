/**
 * Represents a quest.
 */
class Quest {
	constructor(data) {
		/**
		 * Data about this quest
		 * @type {QuestData}
		 */
		this.data = data;
	}

	/**
	 * @returns {string}
	 */
	get name() {
		return this.data.sName;
	}

	/**
	 * The ID of the quest.
	 * @returns {number}
	 */
	get id() {
		return Number.parseInt(this.data.QuestID, 10);
	}

	/**
	 * Whether the quest is in progress.
	 * @returns {boolean}
	 */
	get inProgress() {
		return Bot.getInstance().flash.call(swf.IsInProgress, this.id);
	}

	/**
	 * broken if quest is not loaded
	 * Whether the quest can be completed.
	 * @returns {boolean}
	 */
	get completable() {
		return Bot.getInstance().flash.call(swf.CanComplete, this.id) ?? false;
	}

	/**
	 * Whether the quest is available.
	 * @returns {boolean}
	 */
	get available() {
		return Bot.getInstance().flash.call(swf.IsAvailable, this.id) ?? false;
	}

	hasCompletedBefore() {
		const _q = Bot.getInstance().quests.get(this.id);
		if (!_q) {
			return false;
		}

		const slot = _q.data.iSlot;
		const value = _q.data.iValue;

		return (
			slot < 0 ||
			Bot.getInstance().flash.call('world.getQuestValue', slot) >= value
		);
	}

	get rewards() {
		const ret = this.data.Rewards;
		return ret.map((reward) => ({
			dropChance: reward.DropChance,
			itemID: reward.ItemID,
			itemName: reward.sName,
			quantity: reward.iQty,
		}));
	}

	get requirements() {
		const ret = this.data.RequiredItems;
		return ret.map((req) => ({
			itemID: req.ItemID,
			itemName: req.sName,
			quantity: req.iQty,
		}));
	}
}

// TODO: finish
/**
 * @typedef {Object} QuestData
 */

module.exports = Quest;
