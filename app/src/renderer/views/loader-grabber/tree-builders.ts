import { getEnhancementName, getWeaponProcName } from "@vexed/game";
import type { QuestInfo, ShopInfo, ItemData, MonsterData } from "@vexed/game";
import type {
  GrabbedData,
  GrabbedDataByType,
} from "~/shared/loader-grabber/types";
import { GrabberDataType } from "~/shared/types";

export type TreeItem = {
  children?: TreeItem[];
  name: string;
  value?: string;
};

export function isShopInfo(data: GrabbedData): data is ShopInfo {
  return "items" in data && Array.isArray((data as ShopInfo).items);
}

export function isQuestDataArray(data: GrabbedData): data is QuestInfo[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true;
  const first = data[0];
  return first !== null && first !== undefined && "QuestID" in first;
}

export function isItemDataArray(data: GrabbedData): data is ItemData[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true;
  const first = data[0];
  return first !== null && first !== undefined && "ItemID" in first;
}

export function isMonsterDataArray(data: GrabbedData): data is MonsterData[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true;
  const first = data[0];
  return first !== null && first !== undefined && "MonID" in first;
}

export function buildShopTree(
  data: GrabbedDataByType[GrabberDataType.Shop],
): TreeItem[] {
  return data.items.map((item) => ({
    name: item.sName,
    children: [
      { name: "Shop Item ID", value: String(item.ShopItemID) },
      { name: "ID", value: String(item.ItemID) },
      {
        name: "Cost",
        value: `${item.iCost} ${item.bCoins === 1 ? "ACs" : "Gold"}`,
      },
      { name: "Category", value: item.sType },
      { name: "Description", value: item.sDesc },
    ],
  }));
}

export function buildQuestTree(
  data: GrabbedDataByType[GrabberDataType.Quest],
): TreeItem[] {
  return data.map((quest: QuestInfo) => ({
    name: `${quest.QuestID} - ${quest.sName}`,
    children: [
      { name: "ID", value: String(quest.QuestID) },
      { name: "Description", value: quest.sDesc },
      {
        name: "Required Items",
        children: Object.values(quest?.oItems || {}).map((item) => ({
          name: item.sName,
          children: [
            { name: "ID", value: String(item.ItemID) },
            { name: "Quantity", value: String(item.iQty) },
            {
              name: "Temporary",
              value: item.bTemp ? "Yes" : "No",
            },
            {
              name: "Description",
              value: item.sDesc,
            },
          ],
        })),
      },
      {
        name: "Rewards",
        children: (quest?.Rewards || []).map((item) => ({
          name: item.sName,
          children: [
            {
              name: "ID",
              value: String(item.ItemID),
            },
            {
              name: "Quantity",
              value: String(item.iQty),
            },
            {
              name: "Drop chance",
              value: String(item.DropChance),
            },
          ],
        })),
      },
    ],
  }));
}

export function buildInventoryTree(
  data: GrabbedDataByType[GrabberDataType.Inventory],
): TreeItem[] {
  return data.map((item: ItemData) => {
    const children: TreeItem[] = [
      {
        name: "ID",
        value: String(item.ItemID),
      },
      {
        name: "Char Item ID",
        value: String(item.CharItemID),
      },
      {
        name: "Quantity",
        value: item.sType === "Class" ? "1/1" : `${item.iQty}/${item.iStk}`,
      },
      {
        name: "AC Tagged",
        value: item.bCoins === 1 ? "Yes" : "No",
      },
      {
        name: "Category",
        value: item.sType,
      },
    ];

    const enhancementName = getEnhancementName(item.EnhPatternID);
    const procName = item.ProcID ? getWeaponProcName(item.ProcID) : "";
    const validProc = procName && procName !== "Unknown" ? procName : "";
    if (enhancementName || validProc) {
      const parts = [enhancementName, validProc].filter(Boolean);
      children.push({
        name: "Enhancement",
        value: parts.join(", "),
      });
    }

    children.push({
      name: "Description",
      value: item.sDesc,
    });
    return {
      name: item.sName,
      children,
    };
  });
}

export function buildTempInventoryTree(
  data: GrabbedDataByType[GrabberDataType.TempInventory],
): TreeItem[] {
  return data.map((item) => ({
    name: item.sName,
    children: [
      {
        name: "ID",
        value: String(item.ItemID),
      },
      {
        name: "Quantity",
        value: `${item.iQty}/${item.iStk}`,
      },
    ],
  }));
}

export function buildMonsterTree(
  data: GrabbedDataByType[GrabberDataType.CellMonsters],
  includeHealth: boolean,
): TreeItem[] {
  return data.map((mon) => {
    const ret: TreeItem = {
      name: mon.strMonName,
      children: [
        {
          name: "ID",
          value: String(mon.monId),
        },
        {
          name: "MonMapID",
          value: String(mon.monMapId),
        },
      ],
    };
    ret.children!.push(
      { name: "Race", value: mon.sRace },
      {
        name: "Level",
        value: String(
          "intLevel" in mon && typeof mon.intLevel === "number"
            ? mon.intLevel
            : mon.iLvl,
        ),
      },
    );
    if (includeHealth) {
      ret.children!.push({
        name: "Health",
        value: `${mon.intHP}/${mon.intHPMax}`,
      });
    } else {
      ret.children!.push({
        name: "Cell",
        value: mon.strFrame!,
      });
    }

    return ret;
  });
}

export const grabberBuilders: Record<
  GrabberDataType,
  (data: GrabbedData) => TreeItem[]
> = {
  [GrabberDataType.Shop]: (data) =>
    isShopInfo(data) ? buildShopTree(data) : [],
  [GrabberDataType.Quest]: (data) =>
    isQuestDataArray(data) ? buildQuestTree(data) : [],
  [GrabberDataType.Inventory]: (data) =>
    isItemDataArray(data) ? buildInventoryTree(data) : [],
  [GrabberDataType.TempInventory]: (data) =>
    isItemDataArray(data) ? buildTempInventoryTree(data) : [],
  [GrabberDataType.Bank]: (data) =>
    isItemDataArray(data) ? buildInventoryTree(data) : [],
  [GrabberDataType.CellMonsters]: (data) =>
    isMonsterDataArray(data) ? buildMonsterTree(data, true) : [],
  [GrabberDataType.MapMonsters]: (data) =>
    isMonsterDataArray(data) ? buildMonsterTree(data, false) : [],
};
