import type { ItemData } from "./ItemData";
import type {
  QuestRequirementData,
  QuestBonusRewardData,
  QuestRewardData,
  QuestTurnInData,
} from "./QuestData";

/**
 * Represents the main quest information structure.
 */
export type QuestInfo = {
  FactionID: string;
  /**
   * The ID of this quest.
   */
  QuestID: string;
  RequiredItems: QuestRequirementData[];
  Rewards: QuestBonusRewardData[];
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
  oRewards: Record<string, QuestBonusRewardData>;
  reward: QuestRewardData[];
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
  turnin: QuestTurnInData[];
};

/**
 * Represents a required item for a quest.
 */
export type QuestRequirement = {
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
