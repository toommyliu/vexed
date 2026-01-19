/**
 * Represents the raw data structure for a quest reward.
 */
export type QuestRewardData = {
  /**
   * The item ID.
   */
  ItemID: string;
  /**
   * The quantity of the item.
   */
  iQty: number;
  /**
   * The rate of the reward without a percent sign.
   */
  iRate: string;
  /**
   * The type of the reward.
   */
  iType: string;
};

/**
 * Represents the raw data structure for a quest's required item.
 */
export type QuestRequirementData = {
  /**
   * The item ID.
   */
  ItemID: string;
  /**
   * The quantity of the item.
   */
  iQty: number;
  /**
   * The name of the item.
   */
  sName: string;
};

/**
 * Represents the raw data structure for additional quest rewards.
 */
export type QuestBonusRewardData = {
  /**
   * The drop chance of the item with a percent sign.
   */
  DropChance: string;
  /**
   * The item ID.
   */
  ItemID: string;
  /**
   * The quantity of the item.
   */
  iQty: number;
  /**
   * The name of the item.
   */
  sName: string;
};

/**
 * Represents the raw data structure for quest turn-in requirements.
 */
export type QuestTurnInData = {
  /**
   * The item ID.
   */
  ItemID: string;
  /**
   * The quantity of the item.
   */
  iQty: number;
};