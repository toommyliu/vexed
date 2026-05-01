import type { ShopItem } from "@vexed/game";
import {
  matchesAppliedEnhancement,
  matchesEnhancementShopCandidate,
  matchesEquipEnhancementFilter,
  rankEnhancementCandidates,
  resolveEnhancementStrategy,
  resolveEquipEnhancementFilter,
  type EquipEnhancementSelector,
  type EnhancementStrategy,
} from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import { Effect } from "effect";
import {
  asBoolean,
  asNumber,
  asRecord,
  asString,
} from "../../flash/PacketPayload";
import type { ScriptExecutionContext } from "../Types";
import { waitFor } from "../../utils/waitFor";

const INTEGER_TOKEN_PATTERN = /^\d+$/;

// TODO: make this an ipc confirm dialog?
const confirmPurchase = (message: string) =>
  Effect.sync(() =>
    typeof globalThis.confirm === "function"
      ? globalThis.confirm(message)
      : true,
  );

const toRecord = (value: unknown): Record<string, unknown> =>
  asRecord(value) ?? {};

const toItemId = (item: ItemIdentifierToken): number | undefined => {
  if (typeof item === "number") {
    return Number.isFinite(item) && item > 0 ? Math.trunc(item) : undefined;
  }

  const trimmed = item.trim();
  if (!INTEGER_TOKEN_PATTERN.test(trimmed)) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const loadShopState = (context: ScriptExecutionContext, shopId: number) =>
  context.run(
    waitFor(
      context.shops
        .getInfo()
        .pipe(
          Effect.map(
            (info) =>
              info !== null &&
              Number(info.ShopID) === shopId &&
              info.items.length > 0,
          ),
        ),
      { timeout: "5 seconds" },
    ),
  );

export const loadShopById = (context: ScriptExecutionContext, shopId: number) =>
  Effect.gen(function* () {
    yield* context.run(context.shops.load(shopId));
    yield* loadShopState(context, shopId);
  });

const getTotalQuantityAcrossInventories = (
  context: ScriptExecutionContext,
  itemName: string,
) =>
  Effect.gen(function* () {
    const inventoryItem = yield* context.run(
      context.inventory.getItem(itemName),
    );
    const tempItem = yield* context.run(
      context.tempInventory.getItem(itemName),
    );

    return (inventoryItem?.quantity ?? 0) + (tempItem?.quantity ?? 0);
  });

const buyShopItem = (
  context: ScriptExecutionContext,
  item: ItemIdentifierToken,
  quantity: number,
) =>
  typeof item === "number"
    ? context.run(context.shops.buyById(item, quantity))
    : context.run(context.shops.buyByName(item, quantity));

const normalBuy = (
  context: ScriptExecutionContext,
  item: ItemIdentifierToken,
  quantity: number,
  shopItem: ShopItem,
) =>
  Effect.gen(function* () {
    const cost = asNumber(shopItem.data.iCost) ?? 0;
    if (shopItem.isAC() && cost > 0) {
      const hasConfirmed = yield* confirmPurchase(
        `"${shopItem.name}" costs ${cost} ACs. Proceed?`,
      );
      if (!hasConfirmed) {
        return;
      }
    }

    let adjustedQuantity = quantity;
    if (shopItem.quantity > 1) {
      adjustedQuantity = Math.max(quantity, shopItem.quantity);
    }

    yield* buyShopItem(context, item, adjustedQuantity);
  });

const autoBuy = (
  context: ScriptExecutionContext,
  item: ItemIdentifierToken,
  quantity: number,
  shopItem: ShopItem,
) =>
  Effect.gen(function* () {
    const requirements = Array.isArray(shopItem.data.turnin)
      ? shopItem.data.turnin
      : [];

    if (requirements.length === 0) {
      yield* normalBuy(context, item, quantity, shopItem);
      return;
    }

    const missingItems: Array<{
      readonly cost: number;
      readonly isAC: boolean;
      readonly name: string;
      readonly needed: number;
    }> = [];

    for (const requirement of requirements) {
      if (shopItem.isAC() && (asNumber(shopItem.data.iCost) ?? 0) > 0) {
        continue;
      }

      const requiredPerCraft = asNumber(requirement.iQty) ?? 0;
      const totalNeeded = requiredPerCraft * quantity;
      const currentTotal = yield* getTotalQuantityAcrossInventories(
        context,
        requirement.sName,
      );
      const needed = Math.max(0, totalNeeded - currentTotal);

      if (needed === 0) {
        continue;
      }

      const requiredShopItem = yield* context.run(
        context.shops.getItem(requirement.sName),
      );
      const shopQuantity = requiredShopItem?.quantity ?? 1;
      const buyOperations = Math.ceil(needed / shopQuantity);
      const totalQuantityToBuy = buyOperations * shopQuantity;

      missingItems.push({
        cost: asNumber(requiredShopItem?.data.iCost) ?? 0,
        isAC: requiredShopItem?.isAC() ?? false,
        name: requirement.sName,
        needed: totalQuantityToBuy,
      });
    }

    for (const missing of missingItems) {
      const unit = missing.isAC ? "ACs" : "gold";
      const hasConfirmed = yield* confirmPurchase(
        `Need to buy ${missing.needed}x ${missing.name} for ${
          missing.needed * missing.cost
        } ${unit}. Proceed?`,
      );
      if (!hasConfirmed) {
        return;
      }

      const requiredShopItem = yield* context.run(
        context.shops.getItem(missing.name),
      );
      const shopQuantity = requiredShopItem?.quantity ?? 1;
      const canBuy = yield* context.run(
        context.shops.canBuyItem(missing.name, missing.needed),
      );

      if (!canBuy) {
        continue;
      }

      const buyOperations = Math.ceil(missing.needed / shopQuantity);
      for (let operation = 0; operation < buyOperations; operation += 1) {
        yield* context.run(context.shops.buyByName(missing.name, shopQuantity));
      }
    }

    yield* normalBuy(context, item, quantity, shopItem);
  });

export const buyItem = (
  context: ScriptExecutionContext,
  shopId: number,
  item: ItemIdentifierToken,
  quantity: number,
  auto: boolean,
) =>
  Effect.gen(function* () {
    const currentInfo = yield* context.run(context.shops.getInfo());
    if (currentInfo === null || Number(currentInfo.ShopID) !== shopId) {
      yield* loadShopById(context, shopId);
    }

    let shopItem = yield* context.run(context.shops.getItem(item));
    if (!shopItem) {
      yield* loadShopById(context, shopId);
      shopItem = yield* context.run(context.shops.getItem(item));
    }

    if (!shopItem) {
      return;
    }

    const isMergeShop = auto
      ? yield* context.run(context.shops.isMergeShop())
      : false;

    if (auto && isMergeShop) {
      yield* autoBuy(context, item, quantity, shopItem);
      return;
    }

    yield* normalBuy(context, item, quantity, shopItem);
  });

const resolveDropItemId = (
  context: ScriptExecutionContext,
  item: ItemIdentifierToken,
) =>
  Effect.gen(function* () {
    const directItemId = toItemId(item);
    if (directItemId !== undefined) {
      return directItemId;
    }

    if (typeof item !== "string") {
      return undefined;
    }

    const rawDrops = yield* context.run(context.bridge.call("drops.getItems"));
    const dropValues = Array.isArray(rawDrops)
      ? rawDrops
      : Object.values(toRecord(rawDrops));

    for (const rawDrop of dropValues) {
      const drop = toRecord(rawDrop);
      const dropName = asString(drop["sName"]);
      const dropItemId = asNumber(drop["ItemID"]);

      if (
        dropName !== undefined &&
        dropItemId !== undefined &&
        equalsIgnoreCase(dropName, item)
      ) {
        return dropItemId;
      }
    }

    return undefined;
  });

export const rejectDrop = (
  context: ScriptExecutionContext,
  item: ItemIdentifierToken,
) =>
  Effect.gen(function* () {
    const itemId = yield* resolveDropItemId(context, item);
    if (itemId === undefined) {
      return;
    }

    yield* context.run(context.drops.rejectDrop(itemId));
  });

const logEnhancementWarning = (
  message: string,
  details?: Readonly<Record<string, unknown>>,
) =>
  details === undefined
    ? Effect.logWarning(message)
    : Effect.logWarning(message, details);

const isUpgradeValue = (value: unknown): boolean => {
  const numeric = asNumber(value);
  if (numeric !== undefined) {
    return numeric === 1;
  }

  return asBoolean(value) ?? false;
};

const canUseEnhancementEntry = (
  item: {
    readonly isMember: boolean;
  },
  state: {
    readonly isMember: boolean;
  },
): boolean => !(item.isMember && !state.isMember);

type EnhancementShopEntry = {
  readonly data: Record<string, unknown>;
  readonly id: number;
  readonly isMember: boolean;
  readonly itemGroup: string;
  readonly level: number;
};

export type EnhanceItemOptions = {
  readonly item: string;
  readonly enhancement: string;
  readonly special?: string;
};

const toEnhancementShopEntry = (
  value: unknown,
): EnhancementShopEntry | null => {
  const data = toRecord(value);
  const itemGroup = asString(data["sES"]);
  if (!itemGroup) {
    return null;
  }

  const id = asNumber(data["ItemID"]) ?? asNumber(data["ShopItemID"]) ?? 0;
  const level = asNumber(data["iLvl"]) ?? 0;

  return {
    data,
    id,
    isMember: isUpgradeValue(data["bUpg"]),
    itemGroup,
    level,
  };
};

const findBestEnhancement = (
  context: ScriptExecutionContext,
  strategy: EnhancementStrategy,
) =>
  Effect.gen(function* () {
    const [isMember, shopInfo] = yield* Effect.all([
      context.run(context.player.isMember()),
      context.run(context.shops.getInfo()),
    ]);

    const rawItems = Array.isArray(shopInfo?.items) ? shopInfo.items : [];

    const slotAndPatternMatches: EnhancementShopEntry[] = [];
    const candidates: EnhancementShopEntry[] = [];
    for (const rawItem of rawItems) {
      const shopItem = toEnhancementShopEntry(rawItem);
      if (!shopItem) {
        continue;
      }

      const matchesStrategy = matchesEnhancementShopCandidate(
        {
          data: shopItem.data,
          itemGroup: shopItem.itemGroup,
        },
        strategy,
      );

      if (matchesStrategy) {
        slotAndPatternMatches.push(shopItem);
      }

      if (canUseEnhancementEntry(shopItem, { isMember }) && matchesStrategy) {
        candidates.push(shopItem);
      }
    }

    candidates.sort((left, right) => {
      const leftIsMember = left.isMember;
      const rightIsMember = right.isMember;

      if (leftIsMember !== rightIsMember) {
        return isMember === leftIsMember ? -1 : 1;
      }

      if (right.level !== left.level) {
        return right.level - left.level;
      }

      return left.id - right.id;
    });

    return {
      candidateData: candidates[0]?.data ?? null,
      memberEligibleCount: candidates.length,
      shopItemCount: rawItems.length,
      slotAndPatternCount: slotAndPatternMatches.length,
    };
  });

export const equipItemByEnhancement = (
  context: ScriptExecutionContext,
  selector: EquipEnhancementSelector,
) =>
  Effect.gen(function* () {
    const filterResolution = resolveEquipEnhancementFilter(selector);

    if (!filterResolution.ok) {
      yield* logEnhancementWarning(filterResolution.reason, {
        command: "equip_item_by_enhancement",
        selector,
      });
      return;
    }

    const items = yield* context.run(context.inventory.getItems());
    const candidates = rankEnhancementCandidates(
      items.filter((item) =>
        matchesEquipEnhancementFilter(item, filterResolution.filter),
      ),
    );

    const targetItem = candidates[0];
    if (!targetItem) {
      yield* logEnhancementWarning(
        "No inventory item matched the requested enhancement filter",
        {
          command: "equip_item_by_enhancement",
          selector,
        },
      );
      return;
    }

    console.log(
      `Equipping item ${targetItem.name} (${targetItem.id}) for enhancement ${selector.enhancement}`,
    );

    if (targetItem.isEquipped()) {
      return;
    }

    yield* context.run(context.inventory.equip(targetItem.name));
  });

export const enhanceItem = (
  context: ScriptExecutionContext,
  options: EnhanceItemOptions,
) =>
  Effect.gen(function* () {
    const { item, enhancement, special } = options;
    const playerLevel = yield* context.run(context.player.getLevel());
    const itemRecord = yield* context.run(context.inventory.getItem(item));
    if (!itemRecord) {
      yield* logEnhancementWarning("Item not found in inventory", {
        command: "enhance_item",
        enhancement,
        item,
        special,
      });
      return;
    }

    const strategyResolution = resolveEnhancementStrategy(
      itemRecord,
      enhancement,
      playerLevel,
      special,
    );

    if (!strategyResolution.ok) {
      yield* logEnhancementWarning(strategyResolution.reason, {
        command: "enhance_item",
        enhancement,
        item,
        special,
      });
      return;
    }

    const strategy = strategyResolution.strategy;

    if (strategy.map !== undefined) {
      const currentMap = yield* context.run(context.world.map.getName());
      if (!equalsIgnoreCase(currentMap, strategy.map)) {
        yield* context.run(context.player.joinMap(strategy.map));
      }
    }

    yield* loadShopById(context, strategy.shopId);

    const enhancementSelection = yield* findBestEnhancement(context, strategy);
    if (!enhancementSelection.candidateData) {
      yield* logEnhancementWarning(
        "No purchasable enhancement shop item matched requested strategy",
        {
          command: "enhance_item",
          enhancement,
          item,
          memberEligibleCount: enhancementSelection.memberEligibleCount,
          special,
          shopItemCount: enhancementSelection.shopItemCount,
          shopId: strategy.shopId,
          slotAndPatternCount: enhancementSelection.slotAndPatternCount,
        },
      );
      return;
    }

    yield* context.run(
      context.bridge.callGameFunction("world.confirmSendEnhItemRequestShop", {
        accept: true,
        enh: enhancementSelection.candidateData,
        item: [itemRecord.id],
      }),
    );

    yield* context
      .run(
        waitFor(
          context.inventory
            .getItem(itemRecord.id)
            .pipe(
              Effect.map(
                (updatedItem) =>
                  updatedItem !== null &&
                  matchesAppliedEnhancement(updatedItem, strategy),
              ),
            ),
          { timeout: "5 seconds" },
        ),
      )
      .pipe(
        Effect.catch(() =>
          logEnhancementWarning("Enhancement request did not apply in time", {
            command: "enhance_item",
            enhancement,
            item,
            special,
            shopId: strategy.shopId,
            strategy,
          }),
        ),
      );
  });

export const normalizeItemIdentifier = (
  item: string | number,
): ItemIdentifierToken => {
  if (typeof item === "number") {
    return Math.trunc(item);
  }

  const trimmed = item.trim();
  if (INTEGER_TOKEN_PATTERN.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }

  return trimmed;
};

export const normalizeItemIdentifierList = (
  items: ReadonlyArray<string | number>,
): ReadonlyArray<ItemIdentifierToken> => items.map(normalizeItemIdentifier);
