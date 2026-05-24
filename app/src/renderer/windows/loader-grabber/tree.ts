import { getEnhancementName, getWeaponProcName } from "@vexed/game";
import type {
  GrabbedData,
  GrabbedDataByType,
  LoaderGrabberGrabType,
} from "../../../shared/loader-grabber";

export interface TreeItem {
  readonly children?: readonly TreeItem[];
  readonly name: string;
  readonly raw?: unknown;
  readonly value?: string;
}

export interface FlattenedTreeItem extends TreeItem {
  readonly hasChildren: boolean;
  readonly index: number;
  readonly isLastSibling: boolean;
  readonly level: number;
  readonly nodeId: string;
}

export interface VisibleTreeItems {
  readonly autoExpandedNodeIds: ReadonlySet<string>;
  readonly items: readonly FlattenedTreeItem[];
  readonly matchedRootCount: number;
}

const stringValue = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

const leaf = (name: string, value: unknown): TreeItem => ({
  name,
  value: stringValue(value),
});

const hasValue = (value: unknown): boolean => {
  const normalized = stringValue(value).trim();
  return (
    normalized !== "" && normalized !== "undefined" && normalized !== "null"
  );
};

const itemName = (item: { readonly sName?: unknown }): string =>
  hasValue(item.sName) ? stringValue(item.sName) : "Unnamed item";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const buildShopTree = (data: GrabbedDataByType["shop"]): readonly TreeItem[] =>
  data.items.map((item) => ({
    children: [
      leaf("Shop Item ID", item.ShopItemID),
      leaf("ID", item.ItemID),
      leaf("Cost", `${item.iCost} ${item.bCoins === 1 ? "ACs" : "Gold"}`),
      leaf("Category", item.sType),
      leaf("Description", item.sDesc),
    ],
    name: itemName(item),
    raw: item,
  }));

const buildQuestTree = (
  data: GrabbedDataByType["quest"],
): readonly TreeItem[] =>
  data.map((quest) => ({
    children: [
      leaf("ID", quest.QuestID),
      leaf("Description", quest.sDesc),
      {
        children: Object.values(quest.oItems ?? {}).map((item) => ({
          children: [
            leaf("ID", item.ItemID),
            leaf("Quantity", item.iQty),
            leaf("Temporary", item.bTemp ? "Yes" : "No"),
            leaf("Description", item.sDesc),
          ],
          name: itemName(item),
          raw: item,
        })),
        name: "Required Items",
      },
      {
        children: (quest.Rewards ?? []).map((item) => ({
          children: [
            leaf("ID", item.ItemID),
            leaf("Quantity", item.iQty),
            leaf("Drop chance", item.DropChance),
          ],
          name: itemName(item),
          raw: item,
        })),
        name: "Rewards",
      },
    ],
    name: `${quest.QuestID} - ${quest.sName}`,
    raw: quest,
  }));

const buildInventoryTree = (
  data: GrabbedDataByType["inventory"],
): readonly TreeItem[] =>
  data.map((item) => {
    const children: TreeItem[] = [
      leaf("ID", item.ItemID),
      leaf("Char Item ID", item.CharItemID),
      leaf(
        "Quantity",
        item.sType === "Class" ? "1/1" : `${item.iQty}/${item.iStk}`,
      ),
      leaf("AC Tagged", item.bCoins === 1 ? "Yes" : "No"),
      leaf("Category", item.sType),
    ];
    const enhancementName = getEnhancementName(item.EnhPatternID);
    const procName = item.ProcID ? getWeaponProcName(item.ProcID) : "";
    const validProcName = procName && procName !== "Unknown" ? procName : "";
    const enhancement = [enhancementName, validProcName]
      .filter(Boolean)
      .join(", ");
    if (enhancement !== "") {
      children.push(leaf("Enhancement", enhancement));
    }
    children.push(leaf("Description", item.sDesc));

    return {
      children,
      name: itemName(item),
      raw: item,
    };
  });

const buildTempInventoryTree = (
  data: GrabbedDataByType["temp-inventory"],
): readonly TreeItem[] =>
  data.map((item) => ({
    children: [
      leaf("ID", item.ItemID),
      leaf("Quantity", `${item.iQty}/${item.iStk}`),
    ],
    name: itemName(item),
    raw: item,
  }));

const buildMonsterTree = (
  data: GrabbedDataByType["cell-monsters"],
  includeHp: boolean,
): readonly TreeItem[] =>
  data.map((monster) => ({
    children: [
      leaf("ID", monster.monId),
      leaf("MonMapID", monster.monMapId),
      leaf("Race", monster.sRace),
      leaf("Level", "intLevel" in monster ? monster.intLevel : monster.iLvl),
      includeHp
        ? leaf("Health", `${monster.intHP}/${monster.intHPMax}`)
        : leaf("Cell", monster.strFrame),
    ],
    name: hasValue(monster.strMonName)
      ? stringValue(monster.strMonName)
      : "Unnamed monster",
    raw: monster,
  }));

const builders: {
  readonly [Type in LoaderGrabberGrabType]: (
    data: GrabbedDataByType[Type],
  ) => readonly TreeItem[];
} = {
  bank: buildInventoryTree,
  "cell-monsters": (data) => buildMonsterTree(data, true),
  inventory: buildInventoryTree,
  "map-monsters": (data) => buildMonsterTree(data, false),
  quest: buildQuestTree,
  shop: buildShopTree,
  "temp-inventory": buildTempInventoryTree,
};

export const buildGrabbedDataTree = (
  type: LoaderGrabberGrabType,
  data: GrabbedData,
): readonly TreeItem[] => {
  if (type === "shop") {
    return isRecord(data) && Array.isArray(data.items)
      ? buildShopTree(data as GrabbedDataByType["shop"])
      : [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return builders[type](data as never);
};

const nodeMatchesQuery = (item: TreeItem, query: string): boolean => {
  if (query === "") {
    return true;
  }

  const normalizedName = item.name.toLocaleLowerCase();
  const normalizedValue = item.value?.toLocaleLowerCase() ?? "";
  return normalizedName.includes(query) || normalizedValue.includes(query);
};

const nodeIdFor = (path: readonly number[]): string => path.join(".");

export const buildVisibleTreeItems = (
  data: readonly TreeItem[],
  expandedNodeIds: ReadonlySet<string>,
  query: string,
): VisibleTreeItems => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const items: FlattenedTreeItem[] = [];
  const autoExpandedNodeIds = new Set<string>();

  if (data.length === 0) {
    return { autoExpandedNodeIds, items, matchedRootCount: 0 };
  }

  const pushNode = (
    node: TreeItem,
    level: number,
    path: readonly number[],
    isLastSibling: boolean,
  ) => {
    items.push({
      ...node,
      hasChildren: Boolean(node.children?.length),
      index: items.length,
      isLastSibling,
      level,
      nodeId: nodeIdFor(path),
    });
  };

  if (normalizedQuery !== "") {
    const matchMap = new Map<string, boolean>();
    const computeMatches = (
      node: TreeItem,
      path: readonly number[],
    ): boolean => {
      const nodeId = nodeIdFor(path);
      const selfMatches = nodeMatchesQuery(node, normalizedQuery);
      let childMatches = false;
      node.children?.forEach((child, childIndex) => {
        if (computeMatches(child, [...path, childIndex])) {
          childMatches = true;
        }
      });

      const matches = selfMatches || childMatches;
      matchMap.set(nodeId, matches);
      if (childMatches) {
        autoExpandedNodeIds.add(nodeId);
      }
      return matches;
    };

    let matchedRootCount = 0;
    data.forEach((root, rootIndex) => {
      if (computeMatches(root, [rootIndex])) {
        matchedRootCount += 1;
      }
    });

    const build = (
      node: TreeItem,
      level: number,
      path: readonly number[],
      isLastSibling: boolean,
    ) => {
      const nodeId = nodeIdFor(path);
      if (!matchMap.get(nodeId)) {
        return;
      }

      pushNode(node, level, path, isLastSibling);
      if (!autoExpandedNodeIds.has(nodeId)) {
        return;
      }

      const visibleChildren =
        node.children
          ?.map((child, childIndex) => ({ child, childIndex }))
          .filter(({ childIndex }) =>
            matchMap.get(nodeIdFor([...path, childIndex])),
          ) ?? [];

      visibleChildren.forEach(({ child, childIndex }, visibleIndex) =>
        build(
          child,
          level + 1,
          [...path, childIndex],
          visibleIndex === visibleChildren.length - 1,
        ),
      );
    };

    const visibleRoots = data
      .map((root, rootIndex) => ({ root, rootIndex }))
      .filter(({ rootIndex }) => matchMap.get(nodeIdFor([rootIndex])));
    visibleRoots.forEach(({ root, rootIndex }, visibleIndex) =>
      build(root, 0, [rootIndex], visibleIndex === visibleRoots.length - 1),
    );
    return { autoExpandedNodeIds, items, matchedRootCount };
  }

  const build = (
    node: TreeItem,
    level: number,
    path: readonly number[],
    isLastSibling: boolean,
  ) => {
    pushNode(node, level, path, isLastSibling);
    const nodeId = nodeIdFor(path);
    if (!expandedNodeIds.has(nodeId)) {
      return;
    }

    const children = node.children ?? [];

    children.forEach((child, childIndex) =>
      build(
        child,
        level + 1,
        [...path, childIndex],
        childIndex === children.length - 1,
      ),
    );
  };

  data.forEach((root, rootIndex) =>
    build(root, 0, [rootIndex], rootIndex === data.length - 1),
  );
  return {
    autoExpandedNodeIds,
    items,
    matchedRootCount: data.length,
  };
};

export const toTreeJson = (item: TreeItem): unknown => {
  if (item.raw !== undefined) {
    return item.raw;
  }

  if (item.children?.length) {
    return {
      children: item.children.map(toTreeJson),
      name: item.name,
      ...(item.value === undefined ? {} : { value: item.value }),
    };
  }

  return item.value === undefined
    ? { name: item.name }
    : { name: item.name, value: item.value };
};
