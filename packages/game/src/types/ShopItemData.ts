import type { ItemData } from "./ItemData";

/**
 * Represents the data structure for an item.
 */
export type ShopItemData = ItemData & {
  /**
   * Faction ID associated with the item.
   */
  FactionID: string;
  /**
   * Proc ID for Forge/Awe weapon enhancements
   */
  ItemProcID?: string;
  /**
   * Shop item id.
   */
  ShopItemID: string;
  /**
   * Enhancement-specific properties
   */
  bEnhShop?: boolean;
  /**
   * Whether the item can be placed in a house.
   */
  bHouse: string;
  iClass: string;
  iQSindex: string;
  iQSvalue: string;
  iQtyRemain: string;
  iReqCP: string;
  iReqRep: string;
  /**
   * Faction associated with the item.
   */
  sFaction: string;
  sQuest?: string;
  /**
   * Items required to merge this item.
   */
  turnin?: {
    ItemID: string;
    iQty: string;
    sName: string;
  }[];
};
