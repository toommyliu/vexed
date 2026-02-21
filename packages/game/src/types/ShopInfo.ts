import type { ShopItemData } from "./ShopItemData";

export type ShopInfo = {
  Location: string;
  ShopID: string;
  bHouse: string;
  bStaff: string;
  bUpgrd: string;
  iIndex: string;
  items: ShopItemData[];
  sField: string;
  sName: string;
};
