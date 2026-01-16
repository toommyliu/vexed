import type { 
  QuestInfo, 
  QuestRequirement,
  QuestReward as QuestRewardType 
} from "../types/QuestInfo";
import type { ItemData } from "../types/ItemData";
import type { QuestReward } from "../types/QuestInfo";

/**
 * Represents a quest.
 */
export class Quest {
  public constructor(public data: QuestInfo) {}

  /**
   * The name of this quest.
   */
  public get name(): string {
    return this.data.sName;
  }

  /**
   * The ID of this quest.
   */
  public get id(): number {
    return Number.parseInt(this.data.QuestID, 10);
  }

  /**
   * Whether this quest can only be completed once.
   */
  public get once(): boolean {
    return this.data.bOnce === "1";
  }

  /**
   * The rewards for completing this quest.
   */
  public get rewards(): QuestRewardType[] {
    const ret = this.data.Rewards;
    return ret.map((reward) => ({
      dropChance: reward.DropChance,
      itemId: reward.ItemID,
      itemName: reward.sName,
      quantity: reward.iQty,
    }));
  }

  /**
   * The requirements needed to complete this quest.
   */
  public get requirements(): QuestRequirement[] {
    const ret = this.data.RequiredItems;
    return ret.map((req) => ({
      itemId: req.ItemID,
      itemName: req.sName,
      quantity: req.iQty,
    }));
  }

  /**
   * Whether this quest is a daily quest.
   */
  public isDaily(): boolean {
    return this.data?.sField === "id0";
  }

  /**
   * Whether this quest is a weekly quest.
   */
  public isWeekly(): boolean {
    return this.data?.sField === "iw0";
  }

  /**
   * Whether this quest is a monthly quest.
   */
  public isMonthly(): boolean {
    return this.data?.sField === "im0";
  }
}



/**
 * Represents the raw data structure for a quest reward.
 */
export type QuestRewardRaw = {
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
export type QuestRequiredItemsRaw = {
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
export type QuestRewards2Raw = {
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
export type QuestTurnInRaw = {
  /**
   * The item ID.
   */
  ItemID: string;
  /**
   * The quantity of the item.
   */
  iQty: number;
};

/**
 * Represents a required item for a quest.
 */
export type QuestRequiredItem = {
  /**
   * The item ID.
   */
  itemId: string;
  /**
   * The name of the item.
   */
  itemName: string;
  /**
   * The quantity of the item.
   */
  quantity: number;
};


