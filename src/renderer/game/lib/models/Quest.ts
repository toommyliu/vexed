import { Bot } from '../Bot';
import type { ItemData } from './Item';

/**
 * Represents a quest.
 */
export class Quest {
  #bot = Bot.getInstance();

  public constructor(public data: QuestData) {}

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
   * Whether this quest is in progress.
   */
  public get inProgress(): boolean {
    return this.#bot.flash.call(() => swf.questsIsInProgress(this.id));
  }

  /**
   * Whether this quest can be completed.
   *
   * @remarks
   * The following checks are performed:
   * - The quest is not time-gated (daily, weekly, monthly)
   * - The player has an active membership.
   * - The quest is unlocked (e.g storyline).
   * - The player meets the level requirements.
   * - The player meets the class rank requirements.
   * - The player meets the faction rank requirements.
   * - The player has the required items.
   * @returns boolean - Whether the quest is available.
   */
  public canComplete(): boolean {
    return this.#bot.flash.call(() => swf.questsCanCompleteQuest(this.id));
  }

  /**
   * Whether this quest is available.
   */
  public isAvailable(): boolean {
    return this.#bot.flash.call<boolean>(() => swf.questsIsAvailable(this.id));
  }

  /**
   * Whether this quest requires membership to accept.
   */
  public isUpgrade(): boolean {
    return this.data.bUpg === '1';
  }

  /**
   * Whether this quest has been completed before.
   */
  public hasCompletedBefore(): boolean {
    const quest = this.#bot.quests.get(this.id);
    if (!quest) {
      return false;
    }

    const slot = this.data.iSlot;
    const value = this.data.iValue;

    return (
      slot < 0 ||
      this.#bot.flash.call<number>('world.getQuestValue', slot) >= value
    );
  }

  /**
   * Whether this quest can only be completed once.
   */
  public get once(): boolean {
    return this.data.bOnce === '1';
  }

  /**
   * The rewards for completing this quest.
   */
  public get rewards(): QuestReward[] {
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
  public get requirements(): QuestRequiredItem[] {
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
    return this.data?.sField === 'id0';
  }

  /**
   * Whether this quest is a weekly quest.
   */
  public isWeekly(): boolean {
    return this.data?.sField === 'iw0';
  }

  /**
   * Whether this quest is a monthly quest.
   */
  public isMonthly(): boolean {
    return this.data?.sField === 'im0';
  }
}

export type QuestData = {
  FactionID: string;
  /**
   * The ID of this quest.
   */
  QuestID: string;
  RequiredItems: QuestRequiredItemsRaw[];
  Rewards: QuestRewards2Raw[];
  bGuild: string;
  /**
   * Whether this quest can only be completed once.
   */
  bOnce: string;
  bStaff: string;
  bUpg: string;
  bitSuccess: string;
  iClass: number;
  /**
   * The amount of experience rewarded for completing this quest.
   */
  iExp: number;
  /**
   * The amount of gold rewarded for completing this quest.
   */
  iGold: number;
  iIndex?: number;
  /**
   * The required level to accept this quest.
   */
  iLvl: number;
  /**
   * The amount of reputation rewarded for completing this quest. 0 if not applicable.
   */
  iRep: number;
  /**
   * The class points required to accept this quest. 0 if not applicable.
   */
  iReqCP: number;
  /**
   * The required faction reputation to accept this quest.
   */
  iReqRep: number;
  iSlot: number;
  iValue: number;
  iWar: number;
  metaValues: Record<string, string>;
  oItems: Record<string, ItemData>;
  oRewards: Record<string, QuestRewards2Raw>;
  reward: QuestRewardRaw[];
  /**
   * The description of this quest.
   */
  sDesc: string;
  /**
   * The text displayed when this quest can be completed.
   */
  sEndText: string;
  /**
   * The name of the faction that this quest is for.
   */
  sFaction: string;
  sField?: string;
  /**
   * The name of this quest.
   */
  sName: string;
  /**
   * The status of the quest.
   */
  status: string;
  turnin: QuestTurnInRaw[];
};

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

/**
 * Represents a reward for a quest.
 */
export type QuestReward = {
  /**
   * The drop chance of the item with a percent sign.
   */
  dropChance: string;
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
