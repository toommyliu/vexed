/**
 * Represents a quest.
 */
class Quest {
	/**
	 * @type {import('../Bot')}
	 * @private
	 */
	#bot = Bot.getInstance();

	data: QuestData;

	constructor(data: QuestData) {
		/**
		 * Data about this quest.
		 * @type {QuestData}
		 */
		this.data = data;
	}

	/**
	 * The name of this quest.
	 * @returns {string}
	 */
	get name() {
		return this.data.sName;
	}

	/**
	 * The ID of this quest.
	 * @returns {number}
	 */
	get id() {
		return Number.parseInt(this.data.QuestID, 10);
	}

	/**
	 * Whether this quest is in progress.
	 * @returns {boolean}
	 */
	get inProgress() {
		return this.#bot.flash.call(swf.IsInProgress, this.id);
	}

	/**
	 * Whether this quest can be completed.
	 * @returns {boolean}
	 */
	get completable() {
		if (!this.#bot.quests.get(this.id)) {
			return false;
		}
		return this.#bot.flash.call(swf.CanComplete, this.id) ?? false;
	}

	/**
	 * Whether this quest is available.
	 * @returns {boolean}
	 */
	get available() {
		return this.#bot.flash.call(swf.IsAvailable, this.id) ?? false;
	}

	/**
	 * Whether this quest requires membership to accept.
	 * @returns {boolean}
	 */
	isUpgrade() {
		return this.data.bUpg === '1';
	}

	/**
	 * Whether this quest has been completed before.
	 * @returns {boolean}
	 */
	hasCompletedBefore() {
		const quest = this.#bot.quests.get(this.id);
		if (!quest) {
			return false;
		}

		const slot = this.data.iSlot;
		const value = this.data.iValue;

		return (
			slot < 0 ||
			this.#bot.flash.call('world.getQuestValue', slot) >= value
		);
	}

	/**
	 * Whether this quest can only be completed once.
	 * @returns {boolean}
	 */
	get once() {
		return this.data.bOnce === '1';
	}

	/**
	 * The rewards for completing this quest.
	 * @returns {QuestReward[]}
	 */
	get rewards() {
		const ret = this.data.Rewards;
		return ret.map((reward) => ({
			dropChance: reward.DropChance,
			itemID: reward.ItemID,
			itemName: reward.sName,
			quantity: reward.iQty,
		}));
	}

	/**
	 * The requirements needed to complete this quest.
	 * @returns {QuestRequiredItem[]}
	 */
	get requirements() {
		const ret = this.data.RequiredItems;
		return ret.map((req) => ({
			itemID: req.ItemID,
			itemName: req.sName,
			quantity: req.iQty,
		}));
	}
}

export default Quest;

/**
 * @typedef {Object} QuestData
 * @property {string} status
 * @property {string} bUpg
 * @property {number} iReqRep The required faction rep to accept this quest.
 * @property {string} sFaction The name of the faction that this quest is for.
 * @property {string} bOnce Whether this quest can only be completed once.
 * @property {Record<string,import('./Item').ItemData>} oItems ItemIDs mapped to their data.
 * @property {number} iSlot
 * @property {string} sEndText The text when this quest can be completed.
 * @property {string} sName The name of this quest.
 * @property {Record<unknown,unknown>} metaValues
 * @property {QuestRewardRaw[]} reward
 * @property {number} iValue
 * @property {number} iWar
 * @property {Record<{ "itemsR": Record<string,import('./Item').ItemData>},unknown>} oRewards
 * @property {number} iClass The id of the class required to accept this quest. Otherwise, this value is 0.
 * @property {string} bGuild
 * @property {number} iGold The amount of gold rewarded for completing this quest.
 * @property {QuestRequiredItemsRaw[]} RequiredItems
 * @property {number} iExp The amount of experience rewarded for completing this quest.
 * @property {number} iReqCP The class points required to accept this quest. Otherwise, this value is 0.
 * @property {string} QuestID The ID of this quest.
 * @property {QuestRewards2Raw[]} Rewards
 * @property {string} sDesc The description of this quest.
 * @property {string} bitSuccess
 * @property {string} iLvl The required level to accept this quest.
 * @property {string} bStaff
 * @property {string} FactionID The faction required to accept this quest.
 * @property {QuestTurnInRaw[]} turnin
 * @property {number} iRep The amount of reputation rewarded for completing this quest. Otherwise, this value is 0.
 */
type QuestData = {
	status: string;
	bUpg: string;
	iReqRep: number;
	sFaction: string;
	bOnce: string;
	oItems: Record<string, import('./Item').ItemData>;
	iSlot: number;
	sEndText: string;
	sName: string;
	metaValues: Record<string, string>;
	reward: QuestRewardRaw[];
	iValue: number;
	iWar: number;
	oRewards: Record<string, QuestRewards2Raw>;
	iClass: number;
	bGuild: string;
	iGold: number;
	RequiredItems: QuestRequiredItemsRaw[];
	iExp: number;
	iReqCP: number;
	QuestID: number;
	Rewards: QuestRewards2Raw[];
	sDesc: string;
	bitSuccess: string;
	iLvl: number;
	bStaff: string;
	FactionID: string;
	turnin: QuestTurnInRaw[];
	iRep: number;
};

/**
 * @typedef {Object} QuestRewardRaw
 * @property {string} iRate The rate of the reward without a percent sign.
 * @property {string} ItemID  The item ID.
 * @property {string} iType
 * @property {string} iQty The quantity of the item.
 */
type QuestRewardRaw = {
	iRate: string;
	ItemID: string;
	iType: string;
	iQty: number;
};

/**
 * @typedef {Object} QuestRequiredItemsRaw
 * @property {string} ItemID The item ID.
 * @property {string} sName The name of the item.
 * @property {string} iQty The quantity of the item.
 */
type QuestRequiredItemsRaw = {
	ItemID: string;
	sName: string;
	iQty: number;
};

/**
 * @typedef {Object} QuestRewards2Raw
 * @property {string} ItemID The item ID.
 * @property {string} sName The name of the item.
 * @property {string} iQty The quantity of the item.
 * @property {string} DropChance The drop chance of the item with a percent sign.
 */
type QuestRewards2Raw = {
	ItemID: string;
	sName: string;
	iQty: number;
	DropChance: string;
};

/**
 * @typedef {Object} QuestTurnInRaw
 * @property {string} ItemID The item ID.
 * @property {string} iQty The quantity of the item.
 */
type QuestTurnInRaw = {
	ItemID: string;
	iQty: number;
};

/**
 * @typedef {Object} QuestRequiredItem
 * @property {string} itemID The item ID.
 * @property {string} itemName The name of the item.
 * @property {number} quantity The quantity of the item.
 */
type QuestRequiredItem = {
	itemID: string;
	itemName: string;
	quantity: number;
};

/**
 * @typedef {Object} QuestReward
 * @property {string} dropChance The drop chance of the item with a percent sign.
 * @property {string} itemID The item ID.
 * @property {string} itemName The name of the item.
 * @property {number} quantity The quantity of the item.
 */
type QuestReward = {
	dropChance: string;
	itemID: string;
	itemName: string;
	quantity: number;
};
