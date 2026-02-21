import type { ItemData, MonsterData, QuestInfo, ShopInfo } from "@vexed/game";

export enum LoaderDataType {
  HairShop,
  Shop,
  Quest,
  ArmorCustomizer,
}

export enum GrabberDataType {
  Shop,
  Quest,
  Inventory,
  TempInventory,
  Bank,
  CellMonsters,
  MapMonsters,
}

export type LoaderGrabberLoadRequest =
  | { id: number; type: LoaderDataType.HairShop }
  | { id: number; type: LoaderDataType.Quest }
  | { id: number; type: LoaderDataType.Shop }
  | { type: LoaderDataType.ArmorCustomizer };

export type LoaderGrabberGrabRequest = {
  type: GrabberDataType;
};

export type GrabbedDataByType = {
  [GrabberDataType.Shop]: ShopInfo;
  [GrabberDataType.Quest]: QuestInfo[];
  [GrabberDataType.Inventory]: ItemData[];
  [GrabberDataType.TempInventory]: ItemData[];
  [GrabberDataType.Bank]: ItemData[];
  [GrabberDataType.CellMonsters]: MonsterData[];
  [GrabberDataType.MapMonsters]: MonsterData[];
};

export type GrabbedData = GrabbedDataByType[GrabberDataType];
