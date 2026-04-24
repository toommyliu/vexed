import type { Collection } from "@vexed/collection";
import type { Faction, Item, ShopItem } from "@vexed/game";
import {
  AWE_PROC_VARIANTS,
  CAPE_PROC_VARIANTS,
  EnhancementType,
  FORGE_CAPE_SHOP,
  FORGE_ENHANCEMENT_PATTERN,
  FORGE_HELM_SHOP,
  FORGE_WEAPON_PROC_VARIANTS,
  FORGE_WEAPON_SHOP,
  HELM_PROC_VARIANTS,
  areNamesEqual,
  findEnhancementByName,
  getAweWeaponShopId,
  getBasicEnhancementShopId,
  getCapeProcName,
  getHelmProcName,
  getWeaponProcName,
  isAweProc,
  isBasicEnhancement,
  isForgeWeaponProc,
  resolveCapeSpecial,
  resolveEnhancementType,
  resolveHelmSpecial,
  resolveWeaponSpecial,
} from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import { Effect } from "effect";
import { asNumber, asRecord, asString } from "../../flash/PacketPayload";
import type { ScriptExecutionContext } from "../Types";
import { waitFor } from "../../utils/waitFor";

const INTEGER_TOKEN_PATTERN = /^\d+$/;

type EnhancementStrategy = {
  readonly map?: "forge" | "museum";
  readonly patternId: number;
  readonly procId: number;
  readonly shopId: number;
};

type ItemTypeContext = {
  readonly isArmor: boolean;
  readonly isCape: boolean;
  readonly isHelm: boolean;
  readonly isWeapon: boolean;
};

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
      const canBuy = yield* context.run(context.shops.canBuyItem(missing.name));

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


// Enhancements

const matchesProcInVariants = (
  input: string,
  variants: Record<string, readonly string[]>,
): boolean => {
  const normalized = input.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(variants)) {
    if (canonical === normalized || aliases.includes(normalized)) {
      return true;
    }
  }

  return false;
};

const matchesBasicEnhancement = (
  item: Item,
  enhancementName: string,
): boolean => {
  const targetEnhancement = findEnhancementByName(enhancementName);
  return item.enhancementPatternId === targetEnhancement?.ID;
};

const matchesWeaponProc = (item: Item, procName: string): boolean => {
  const itemRecord = toRecord(item.data);
  const procId = asNumber(itemRecord["ProcID"]);
  if (procId === undefined) {
    return false;
  }

  return areNamesEqual(getWeaponProcName(procId), procName, {
    ...AWE_PROC_VARIANTS,
    ...FORGE_WEAPON_PROC_VARIANTS,
  });
};

const matchesCapeProc = (item: Item, procName: string): boolean =>
  areNamesEqual(
    getCapeProcName(item.enhancementPatternId),
    procName,
    CAPE_PROC_VARIANTS,
  );

const matchesHelmProc = (item: Item, procName: string): boolean =>
  areNamesEqual(
    getHelmProcName(item.enhancementPatternId),
    procName,
    HELM_PROC_VARIANTS,
  );

export const equipItemByEnhancement = (
  context: ScriptExecutionContext,
  enhancementName: string,
  procOrItemType?: string,
) =>
  Effect.gen(function* () {
    const items = yield* context.run(context.inventory.getItems());
    const secondArg = (procOrItemType ?? "").toLowerCase().trim();
    const isForge = enhancementName.toLowerCase().trim() === "forge";
    const isBasic = isBasicEnhancement(enhancementName);
    const isItemTypeFilter = ["weapon", "helm", "cape"].includes(secondArg);
    const isAweProc = matchesProcInVariants(secondArg, AWE_PROC_VARIANTS);

    const targetItem = items.find((item) => {
      if (!item.isWeapon() && !item.isCape() && !item.isHelm()) {
        return false;
      }

      if (isForge) {
        if (!procOrItemType) {
          return false;
        }

        if (matchesProcInVariants(procOrItemType, FORGE_WEAPON_PROC_VARIANTS)) {
          return item.isWeapon() && matchesWeaponProc(item, procOrItemType);
        }

        if (matchesProcInVariants(procOrItemType, CAPE_PROC_VARIANTS)) {
          return item.isCape() && matchesCapeProc(item, procOrItemType);
        }

        if (matchesProcInVariants(procOrItemType, HELM_PROC_VARIANTS)) {
          return item.isHelm() && matchesHelmProc(item, procOrItemType);
        }

        return (
          (item.isWeapon() && matchesWeaponProc(item, procOrItemType)) ||
          (item.isCape() && matchesCapeProc(item, procOrItemType)) ||
          (item.isHelm() && matchesHelmProc(item, procOrItemType))
        );
      }

      if (isBasic && isAweProc && procOrItemType) {
        return (
          item.isWeapon() &&
          matchesBasicEnhancement(item, enhancementName) &&
          matchesWeaponProc(item, procOrItemType)
        );
      }

      if (isBasic && isItemTypeFilter) {
        if (secondArg === "weapon" && !item.isWeapon()) {
          return false;
        }

        if (secondArg === "cape" && !item.isCape()) {
          return false;
        }

        if (secondArg === "helm" && !item.isHelm()) {
          return false;
        }

        return matchesBasicEnhancement(item, enhancementName);
      }

      if (isBasic && secondArg === "") {
        return matchesBasicEnhancement(item, enhancementName);
      }

      return false;
    });

    if (!targetItem || targetItem.isEquipped()) {
      return;
    }

    yield* context.run(context.inventory.equip(targetItem.name));
  });

const resolveEnhancementStrategy = (
  item: Item,
  enhancementName: string,
  playerLevel: number,
  procName?: string,
): EnhancementStrategy | null => {
  const enhancementInput = enhancementName.toLowerCase().trim();
  const procInput = (procName ?? "").toLowerCase().trim();
  const basicType = resolveEnhancementType(enhancementInput);
  const weaponProc = resolveWeaponSpecial(procInput);
  const itemContext: ItemTypeContext = {
    isArmor: item.category.toLowerCase() === "class" || item.isArmor(),
    isCape: item.isCape(),
    isHelm: item.isHelm(),
    isWeapon: item.isWeapon(),
  };

  if (itemContext.isWeapon && weaponProc !== null) {
    if (isForgeWeaponProc(weaponProc)) {
      return {
        map: "forge",
        patternId: FORGE_ENHANCEMENT_PATTERN,
        procId: weaponProc,
        shopId: FORGE_WEAPON_SHOP,
      };
    }

    if (isAweProc(weaponProc)) {
      const baseType = basicType ?? EnhancementType.Lucky;
      const aweShopId = getAweWeaponShopId(baseType);
      if (aweShopId === undefined) {
        return null;
      }

      return {
        map: "museum",
        patternId: baseType,
        procId: weaponProc,
        shopId: aweShopId,
      };
    }

    return null;
  }

  if (
    itemContext.isWeapon &&
    enhancementInput === "forge" &&
    procInput === ""
  ) {
    return {
      map: "forge",
      patternId: FORGE_ENHANCEMENT_PATTERN,
      procId: 0,
      shopId: FORGE_WEAPON_SHOP,
    };
  }

  if (itemContext.isCape && enhancementInput === "forge") {
    return {
      map: "forge",
      patternId: resolveCapeSpecial(procInput) ?? FORGE_ENHANCEMENT_PATTERN,
      procId: 0,
      shopId: FORGE_CAPE_SHOP,
    };
  }

  if (itemContext.isHelm && enhancementInput === "forge") {
    return {
      map: "forge",
      patternId: resolveHelmSpecial(procInput) ?? FORGE_ENHANCEMENT_PATTERN,
      procId: 0,
      shopId: FORGE_HELM_SHOP,
    };
  }

  if (basicType === null) {
    return null;
  }

  if (
    !itemContext.isWeapon &&
    !itemContext.isCape &&
    !itemContext.isHelm &&
    !itemContext.isArmor
  ) {
    return null;
  }

  if (
    procInput !== "" &&
    !itemContext.isWeapon &&
    resolveWeaponSpecial(procInput) !== null
  ) {
    return null;
  }

  return {
    patternId: basicType,
    procId: 0,
    shopId: getBasicEnhancementShopId(basicType, playerLevel),
  };
};

// Filter enhancement shop entries through the current player's constraints
// before choosing a target, so selection stays aligned with what the client can
// actually buy right now.

const canPurchaseEnhancement = (
  context: ScriptExecutionContext,
  shopItem: ShopItem,
  state: {
    readonly factions: Collection<string, Faction>;
    readonly gold: number;
    readonly isMember: boolean;
    readonly level: number;
  },
) =>
  Effect.gen(function* () {
    const shopItemData = toRecord(shopItem.data);
    const cost = asNumber(shopItemData["iCost"]) ?? 0;
    const level = asNumber(shopItemData["iLvl"]) ?? 0;
    const isUpgradeItem = asNumber(shopItemData["bUpg"]) === 1;

    if (
      state.gold < cost ||
      level > state.level ||
      (isUpgradeItem && !state.isMember)
    ) {
      return false;
    }

    const requiredRep = asNumber(shopItemData["iReqRep"]) ?? 0;
    const factionId = asNumber(shopItemData["FactionID"]) ?? 0;
    if (requiredRep > 0 && factionId > 0) {
      const faction = [...state.factions.values()].find(
        (entry) => entry.id === factionId,
      );
      if (!faction || faction.totalRep < requiredRep) {
        return false;
      }
    }

    const questSlot = asNumber(shopItemData["iQSindex"]) ?? -1;
    const questValue = asNumber(shopItemData["iQSvalue"]) ?? 0;
    if (questSlot >= 0) {
      const currentValue = yield* context.run(
        context.bridge.callGameFunction("world.getQuestValue", questSlot),
      );
      if ((asNumber(currentValue) ?? 0) < questValue) {
        return false;
      }
    }

    return true;
  });

const matchesEnhancementCategory = (
  shopItem: ShopItem,
  item: Item,
): boolean => {
  const enhancementTarget = shopItem.itemGroup.toLowerCase();
  const category = item.category.toLowerCase();

  return (
    (category === "class" && enhancementTarget === "ar") ||
    (category === "helm" && enhancementTarget === "he") ||
    (category === "cape" && enhancementTarget === "ba") ||
    (item.isWeapon() && enhancementTarget === "weapon")
  );
};

const matchesEnhancementPattern = (
  shopItem: ShopItem,
  patternId: number,
  procId: number,
): boolean => {
  const shopItemData = toRecord(shopItem.data);
  const itemPatternId =
    asNumber(shopItemData["PatternID"]) ??
    asNumber(shopItemData["EnhPatternID"]) ??
    0;
  const itemProcId =
    asNumber(shopItemData["ItemProcID"]) ??
    asNumber(shopItemData["ProcID"]) ??
    0;

  return procId > 0
    ? itemProcId === procId
    : itemPatternId === patternId && itemProcId === 0;
};

const matchesAppliedEnhancement = (
  item: Item,
  patternId: number,
  procId: number,
): boolean => {
  if (item.enhancementPatternId !== patternId) {
    return false;
  }

  if (procId <= 0) {
    return true;
  }

  return (asNumber(toRecord(item.data)["ProcID"]) ?? 0) === procId;
};

const findBestEnhancement = (
  context: ScriptExecutionContext,
  item: Item,
  strategy: EnhancementStrategy,
) =>
  Effect.gen(function* () {
    const [factions, gold, isMember, level, shopItems] = yield* Effect.all([
      context.run(context.player.getFactions()),
      context.run(context.player.getGold()),
      context.run(context.player.isMember()),
      context.run(context.player.getLevel()),
      context.run(context.shops.getItems()),
    ]);

    const candidates: ShopItem[] = [];
    for (const shopItem of shopItems) {
      const canPurchase = yield* canPurchaseEnhancement(context, shopItem, {
        factions,
        gold,
        isMember,
        level,
      });

      if (
        canPurchase &&
        matchesEnhancementCategory(shopItem, item) &&
        matchesEnhancementPattern(shopItem, strategy.patternId, strategy.procId)
      ) {
        candidates.push(shopItem);
      }
    }

    candidates.sort((left, right) => {
      const leftIsMember = left.isMember();
      const rightIsMember = right.isMember();

      if (leftIsMember !== rightIsMember) {
        return isMember === leftIsMember ? -1 : 1;
      }

      return right.level - left.level;
    });

    return candidates[0] ?? null;
  });

export const enhanceItem = (
  context: ScriptExecutionContext,
  itemName: string,
  enhancementName: string,
  procName?: string,
) =>
  Effect.gen(function* () {
    const playerLevel = yield* context.run(context.player.getLevel());
    const item = yield* context.run(context.inventory.getItem(itemName));
    if (!item) {
      return;
    }

    const strategy = resolveEnhancementStrategy(
      item,
      enhancementName,
      playerLevel,
      procName,
    );
    if (!strategy) {
      return;
    }

    if (strategy.map !== undefined) {
      const currentMap = yield* context.run(context.world.map.getName());
      if (currentMap.toLowerCase() !== strategy.map) {
        yield* context.run(context.player.joinMap(strategy.map));
      }
    }

    yield* loadShopById(context, strategy.shopId);

    const enhancementItem = yield* findBestEnhancement(context, item, strategy);
    if (!enhancementItem) {
      return;
    }

    yield* context.run(
      context.bridge.callGameFunction("world.confirmSendEnhItemRequestShop", {
        accept: true, // Skip confirmation
        enh: enhancementItem.data,
        item: [item.id],
      }),
    );
    yield* context.run(
      waitFor(
        context.inventory
          .getItem(item.id)
          .pipe(
            Effect.map(
              (updatedItem) =>
                updatedItem !== null &&
                matchesAppliedEnhancement(
                  updatedItem,
                  enhancementItem.enhancementPatternId,
                  strategy.procId,
                ),
            ),
          ),
        { timeout: "5 seconds" },
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
