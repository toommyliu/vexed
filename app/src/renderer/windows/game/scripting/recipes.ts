import type { Item, ItemData } from "@vexed/game";
import {
  matchesAppliedEnhancement,
  matchesEnhancementShopCandidate,
  matchesEquipEnhancementFilter,
  rankEnhancementCandidates,
  resolveEnhancementStrategy,
  resolveEquipEnhancementFilter,
  type EnhancementStrategy,
  type EquipEnhancementSelector,
} from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import { Deferred, Effect, Number as EffectNumber, Option } from "effect";
import type { AuthShape } from "../flash/Services/Auth";
import type { BankShape } from "../flash/Services/Bank";
import type { BridgeShape } from "../flash/Services/Bridge";
import type { CombatShape } from "../flash/Services/Combat";
import type { DropsShape } from "../flash/Services/Drops";
import type { InventoryShape } from "../flash/Services/Inventory";
import type { PacketShape } from "../flash/Services/Packet";
import type { PlayerShape } from "../flash/Services/Player";
import type { QuestsShape } from "../flash/Services/Quests";
import type { ShopsShape } from "../flash/Services/Shops";
import type { TempInventoryShape } from "../flash/Services/TempInventory";
import type { WorldShape } from "../flash/Services/World";
import { asItemData } from "../flash/ItemDataPayload";
import {
  asBoolean,
  asNumber,
  asRecord,
  asString,
} from "../flash/PacketPayload";
import type { ConsumableSkillItem } from "../flash/Types";
import { waitFor } from "../utils/waitFor";
import { ScriptExecutionError } from "./Errors";

export type ScriptRecipeEffect<A> = Effect.Effect<A, unknown>;

export interface ScriptRecipeDependencies {
  readonly sourceName: string;
  readonly auth: AuthShape;
  readonly bank: BankShape;
  readonly bridge: BridgeShape;
  readonly combat: CombatShape;
  readonly drops: DropsShape;
  readonly inventory: InventoryShape;
  readonly packet: PacketShape;
  readonly player: PlayerShape;
  readonly quests: QuestsShape;
  readonly shops: ShopsShape;
  readonly tempInventory: TempInventoryShape;
  readonly world: WorldShape;
}

export interface ScriptEnhanceItemOptions {
  readonly enhancement: string;
  readonly special?: string;
}

export type ScriptEquipItemByEnhancementOptions = EquipEnhancementSelector;

export interface ScriptRecipesShape {
  buff(
    skillList?: readonly number[] | null,
    wait?: boolean,
  ): ScriptRecipeEffect<void>;
  ensureLifeSteal(quantity: number): ScriptRecipeEffect<void>;
  ensureScrollOfEnrage(quantity: number): ScriptRecipeEffect<void>;
  useConsumables(
    items: string | readonly string[],
    equipAfter?: string,
  ): ScriptRecipeEffect<void>;
  goToHouse(player?: string): ScriptRecipeEffect<void>;
  beep(times?: number): ScriptRecipeEffect<void>;
  doWheelOfDoom(toBank?: boolean): ScriptRecipeEffect<void>;
  waitForPlayerCount(count: number, exact?: boolean): ScriptRecipeEffect<void>;
  equipItemByEnhancement(
    options: ScriptEquipItemByEnhancementOptions,
  ): ScriptRecipeEffect<void>;
  enhanceItem(
    item: string,
    options: ScriptEnhanceItemOptions,
  ): ScriptRecipeEffect<void>;
}

const DEFAULT_BUFF_SKILLS = [1, 2, 3] as const;
const CONSUMABLE_SKILL_INDEX = 5;
const GEAR_OF_DOOM = "Gear of Doom";
const TREASURE_POTION = "Treasure Potion";
const WHEEL_OF_DOOM_QUEST_ID = 3_076;

const requireFiniteNumber = (
  deps: ScriptRecipeDependencies,
  recipe: string,
  name: string,
  value: unknown,
): Effect.Effect<number, ScriptExecutionError> =>
  Effect.suspend(() => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Effect.succeed(value);
    }

    return Effect.fail(
      new ScriptExecutionError({
        sourceName: deps.sourceName,
        message: `api.recipes.${recipe}: ${name} must be a finite number`,
        cause: value,
      }),
    );
  });

const requireNonEmptyString = (
  deps: ScriptRecipeDependencies,
  recipe: string,
  name: string,
  value: unknown,
): Effect.Effect<string, ScriptExecutionError> =>
  Effect.suspend(() => {
    if (typeof value === "string" && value.trim() !== "") {
      return Effect.succeed(value.trim());
    }

    return Effect.fail(
      new ScriptExecutionError({
        sourceName: deps.sourceName,
        message: `api.recipes.${recipe}: ${name} must be a non-empty string`,
        cause: value,
      }),
    );
  });

const requireObject = (
  deps: ScriptRecipeDependencies,
  recipe: string,
  name: string,
  value: unknown,
): Effect.Effect<Record<string, unknown>, ScriptExecutionError> =>
  Effect.suspend(() => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return Effect.succeed(value as Record<string, unknown>);
    }

    return Effect.fail(
      new ScriptExecutionError({
        sourceName: deps.sourceName,
        message: `api.recipes.${recipe}: ${name} must be an object`,
        cause: value,
      }),
    );
  });

const loadShopById = (
  deps: ScriptRecipeDependencies,
  shopId: number,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    yield* deps.shops.load(shopId);
    yield* waitFor(
      deps.shops
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
    );
  });

const logRecipeWarning = (
  message: string,
  details?: Readonly<Record<string, unknown>>,
): Effect.Effect<void> =>
  details === undefined
    ? Effect.logWarning(message)
    : Effect.logWarning(message, details);

const normalizeBuffSkills = (
  deps: ScriptRecipeDependencies,
  skillList?: readonly number[] | null,
) =>
  Effect.gen(function* () {
    if (
      skillList === undefined ||
      skillList === null ||
      skillList.length === 0
    ) {
      return DEFAULT_BUFF_SKILLS;
    }

    const normalizedSkills: number[] = [];
    for (const [index, skill] of skillList.entries()) {
      const normalizedSkill = yield* requireFiniteNumber(
        deps,
        "buff",
        `skillList[${index}]`,
        skill,
      );
      normalizedSkills.push(Math.trunc(normalizedSkill));
    }

    return normalizedSkills;
  });

const buff = (
  deps: ScriptRecipeDependencies,
  skillList?: readonly number[] | null,
  wait = false,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const skills = yield* normalizeBuffSkills(deps, skillList);
    yield* Effect.forEach(skills, (skill) =>
      deps.combat
        .useSkill(skill, true, wait)
        .pipe(Effect.andThen(Effect.sleep("1 second"))),
    ).pipe(Effect.asVoid);
  });

const normalizeConsumableName = (name: string): string =>
  name.trim().toLowerCase().replaceAll(/\s+/g, " ");

const consumableSkillItemMatches = (
  consumableSkillItem: ConsumableSkillItem | null,
  expectedItem: Item,
): boolean => {
  if (!consumableSkillItem) {
    return false;
  }

  if (consumableSkillItem.itemId !== undefined) {
    return consumableSkillItem.itemId === expectedItem.id;
  }

  if (consumableSkillItem.name !== undefined) {
    return (
      normalizeConsumableName(consumableSkillItem.name) ===
      normalizeConsumableName(expectedItem.name)
    );
  }

  return false;
};

const waitForConsumableSkillSlot = (
  deps: ScriptRecipeDependencies,
  expectedItem: Item,
) =>
  waitFor(
    Effect.map(deps.combat.getConsumableSkillItem(), (consumableSkillItem) =>
      consumableSkillItemMatches(consumableSkillItem, expectedItem),
    ),
    { timeout: "2 seconds" },
  );

const normalizeConsumableItems = (
  deps: ScriptRecipeDependencies,
  recipe: string,
  items: string | readonly string[],
): Effect.Effect<readonly string[], ScriptExecutionError> =>
  Effect.gen(function* () {
    const rawItems = Array.isArray(items) ? items : [items];
    const normalizedItems: string[] = [];

    for (const [index, item] of rawItems.entries()) {
      const normalized = yield* requireNonEmptyString(
        deps,
        recipe,
        Array.isArray(items) ? `items[${index}]` : "items",
        item,
      );
      normalizedItems.push(normalized);
    }

    return normalizedItems;
  });

const useConsumables = (
  deps: ScriptRecipeDependencies,
  items: string | readonly string[],
  equipAfter?: string,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const normalizedItems = yield* normalizeConsumableItems(
      deps,
      "useConsumables",
      items,
    );

    const normalizedEquipAfter =
      equipAfter === undefined
        ? undefined
        : yield* requireNonEmptyString(
            deps,
            "useConsumables",
            "equipAfter",
            equipAfter,
          );

    for (const item of normalizedItems) {
      const inventoryItem = yield* deps.inventory.getItem(item);
      if (!inventoryItem) {
        return yield* new ScriptExecutionError({
          sourceName: deps.sourceName,
          message: `Consumable "${item}" was not found in inventory.`,
        });
      }

      const equipped = yield* deps.inventory.equip(item);
      if (!equipped) {
        return yield* new ScriptExecutionError({
          sourceName: deps.sourceName,
          message: `Consumable "${item}" could not be equipped.`,
        });
      }

      const slotMatches = yield* waitForConsumableSkillSlot(
        deps,
        inventoryItem,
      );
      if (!slotMatches) {
        return yield* new ScriptExecutionError({
          sourceName: deps.sourceName,
          message: `Consumable "${inventoryItem.name}" did not appear in slot ${CONSUMABLE_SKILL_INDEX}.`,
        });
      }

      yield* deps.combat.useSkill(CONSUMABLE_SKILL_INDEX, true, true);
      yield* Effect.sleep("1 second");
    }

    if (normalizedEquipAfter !== undefined) {
      yield* deps.inventory.equip(normalizedEquipAfter);
    }
  });

const ensureLifeSteal = (
  deps: ScriptRecipeDependencies,
  quantity: number,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const rawQuantity = yield* requireFiniteNumber(
      deps,
      "ensureLifeSteal",
      "quantity",
      quantity,
    );
    const targetQuantity = EffectNumber.clamp(Math.floor(rawQuantity), {
      minimum: 1,
      maximum: 99,
    });
    const itemName = "Scroll of Life Steal";
    const current = yield* deps.inventory.getItem(itemName);
    const needed = targetQuantity - (current?.quantity ?? 0);
    if (needed <= 0) {
      return;
    }

    yield* deps.player.joinMap("arcangrove", "Potion", "Right");
    yield* loadShopById(deps, 211);
    yield* deps.shops.buyByName(itemName, needed);
  });

const ensureScrollOfEnrage = (
  deps: ScriptRecipeDependencies,
  quantity: number,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const rawQuantity = yield* requireFiniteNumber(
      deps,
      "ensureScrollOfEnrage",
      "quantity",
      quantity,
    );
    const targetQuantity = EffectNumber.clamp(Math.floor(rawQuantity), {
      minimum: 1,
      maximum: 1_000,
    });
    const itemName = "Scroll of Enrage";
    if (yield* deps.inventory.contains(itemName, targetQuantity)) {
      return;
    }

    yield* deps.bank.withdrawMany(
      "Gold Voucher 100k",
      "Arcane Quill",
      "Zealous Ink",
    );
    yield* deps.player.joinMap("spellcraft");
    yield* loadShopById(deps, 693);

    while (!(yield* deps.inventory.contains(itemName, targetQuantity))) {
      if (yield* deps.drops.containsDrop(itemName)) {
        yield* deps.drops.acceptDrop(itemName);
      }

      yield* deps.quests.accept(2330, true);

      if (!(yield* deps.inventory.contains("Gold Voucher 100k", 1))) {
        if ((yield* deps.player.getGold()) < 100_000) {
          return;
        }
        yield* deps.shops.buyByName("Gold Voucher 100k", 1);
      }

      if (!(yield* deps.inventory.contains("Arcane Quill", 1))) {
        if ((yield* deps.player.getGold()) < 100_000) {
          return;
        }
        yield* deps.shops.buyByName("Arcane Quill", 1);
      }

      if (!(yield* deps.inventory.contains("Zealous Ink", 5))) {
        if (!(yield* deps.inventory.contains("Arcane Quill", 1))) {
          return;
        }
        yield* deps.shops.buyByName("Zealous Ink", 5);
      }

      if (!(yield* deps.quests.canComplete(2330))) {
        return;
      }
      yield* deps.quests.complete(2330, 5);
    }
    yield* deps.quests.abandon(2330);
  });

const goToHouse = (
  deps: ScriptRecipeDependencies,
  player?: string,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const playerName =
      player === undefined
        ? yield* deps.auth.getUsername()
        : yield* requireNonEmptyString(deps, "goToHouse", "player", player);

    yield* deps.combat.exit();
    yield* deps.world.map.waitForGameAction("tfer");
    yield* deps.packet.sendServer(`%xt%zm%house%1%${playerName}%`);
    yield* waitFor(
      Effect.gen(function* () {
        if (!(yield* deps.world.map.isLoaded())) return false;

        const mapName = yield* deps.world.map.getName();
        if (!equalsIgnoreCase(mapName, "house")) return false;

        return yield* deps.player.isReady();
      }),
      { timeout: "5 seconds" },
    );
  });

const beep = (
  deps: ScriptRecipeDependencies,
  times = 1,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const normalizedTimes = Math.max(
      1,
      Math.floor(yield* requireFiniteNumber(deps, "beep", "times", times)),
    );

    yield* Effect.sync(() => {
      const AudioContextClass = globalThis.AudioContext;
      if (!AudioContextClass) {
        return;
      }

      const audioContext = new AudioContextClass();
      for (let index = 0; index < normalizedTimes; index += 1) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.2;
        oscillator.start(audioContext.currentTime + index * 0.25);
        oscillator.stop(audioContext.currentTime + index * 0.25 + 0.15);
      }
      // TODO: consider bouncing the tray icon too.
      setTimeout(() => void audioContext.close(), normalizedTimes * 250 + 500);
    });
  });

const extractWheelRewardItems = (payload: unknown): readonly ItemData[] => {
  const data = asRecord(payload);
  if (!data) {
    return [];
  }

  const items = new Map<number, ItemData>();
  const addItem = (value: unknown) => {
    const item = asItemData(value);
    if (item) {
      items.set(item.ItemID, item);
    }
  };

  const dropItems = asRecord(data["dropItems"]);
  if (dropItems) {
    for (const value of Object.values(dropItems)) {
      addItem(value);
    }
  }

  addItem(data["Item"]);

  return Array.from(items.values());
};

const completeWheelOfDoomAndReadRewards = (
  deps: ScriptRecipeDependencies,
): Effect.Effect<readonly ItemData[], unknown> =>
  Effect.gen(function* () {
    const result = yield* Deferred.make<readonly ItemData[]>();
    const dispose = yield* deps.packet.json("Wheel", (packet) =>
      Deferred.succeed(result, extractWheelRewardItems(packet.data)),
    );

    return yield* Effect.gen(function* () {
      yield* deps.quests.complete(WHEEL_OF_DOOM_QUEST_ID);
      const rewards = yield* Deferred.await(result).pipe(
        Effect.timeoutOption("5 seconds"),
      );

      return Option.isSome(rewards) ? rewards.value : [];
    }).pipe(Effect.ensuring(Effect.sync(dispose)));
  });

const doWheelOfDoom = (
  deps: ScriptRecipeDependencies,
  toBank = false,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    if (!(yield* deps.inventory.contains(GEAR_OF_DOOM, 3))) {
      yield* deps.bank.open(true);
      if (!(yield* deps.bank.contains(GEAR_OF_DOOM, 3))) {
        return;
      }
      yield* deps.bank.withdraw(GEAR_OF_DOOM);
    }

    yield* deps.player.joinMap("doom-1e99");
    yield* deps.quests.accept(WHEEL_OF_DOOM_QUEST_ID, true);
    if (!(yield* deps.quests.canComplete(WHEEL_OF_DOOM_QUEST_ID))) {
      return;
    }

    if (toBank !== true) {
      yield* deps.quests.complete(WHEEL_OF_DOOM_QUEST_ID);
      return;
    }

    const rewards = yield* completeWheelOfDoomAndReadRewards(deps);
    const bankableRewards = rewards.filter(
      (item) => item.sName !== TREASURE_POTION,
    );
    if (bankableRewards.length === 0) {
      return;
    }

    yield* Effect.log(
      "Depositing Wheel of Doom rewards to bank",
      bankableRewards,
    );

    yield* deps.bank.open(true);
    yield* deps.bank.depositMany(...bankableRewards.map((item) => item.sName));
  });

const waitForPlayerCount = (
  deps: ScriptRecipeDependencies,
  count: number,
  exact = false,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const normalizedCount = Math.max(
      0,
      Math.floor(
        yield* requireFiniteNumber(deps, "waitForPlayerCount", "count", count),
      ),
    );

    yield* waitFor(
      Effect.map(deps.world.players.getAll(), (players) =>
        exact
          ? players.size === normalizedCount
          : players.size >= normalizedCount,
      ),
      { timeout: "30 seconds" },
    );
  });

const isUpgradeValue = (value: unknown): boolean => {
  const numeric = asNumber(value);
  if (numeric !== undefined) {
    return numeric === 1;
  }

  return asBoolean(value) ?? false;
};

const canUseEnhancementEntry = (
  item: { readonly isMember: boolean },
  state: { readonly isMember: boolean },
): boolean => !(item.isMember && !state.isMember);

type EnhancementShopEntry = {
  readonly data: Record<string, unknown>;
  readonly id: number;
  readonly isMember: boolean;
  readonly itemGroup: string;
  readonly level: number;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

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
  deps: ScriptRecipeDependencies,
  strategy: EnhancementStrategy,
) =>
  Effect.gen(function* () {
    const [isMember, shopInfo] = yield* Effect.all([
      deps.player.isMember(),
      deps.shops.getInfo(),
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

const validateEnhancementSelector = (
  deps: ScriptRecipeDependencies,
  selector: ScriptEquipItemByEnhancementOptions,
) =>
  Effect.gen(function* () {
    const options = yield* requireObject(
      deps,
      "equipItemByEnhancement",
      "options",
      selector,
    );
    yield* requireNonEmptyString(
      deps,
      "equipItemByEnhancement",
      "options.enhancement",
      options["enhancement"],
    );
    return options as unknown as ScriptEquipItemByEnhancementOptions;
  });

const equipItemByEnhancement = (
  deps: ScriptRecipeDependencies,
  selector: ScriptEquipItemByEnhancementOptions,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const normalizedSelector = yield* validateEnhancementSelector(
      deps,
      selector,
    );
    const filterResolution = resolveEquipEnhancementFilter(normalizedSelector);

    if (!filterResolution.ok) {
      yield* logRecipeWarning(filterResolution.reason, {
        recipe: "equipItemByEnhancement",
        selector: normalizedSelector,
      });
      return;
    }

    const items = yield* deps.inventory.getItems();
    const candidates = rankEnhancementCandidates(
      items.filter((item) =>
        matchesEquipEnhancementFilter(item, filterResolution.filter),
      ),
    );

    const targetItem = candidates[0];
    if (!targetItem) {
      yield* logRecipeWarning(
        "No inventory item matched the requested enhancement filter",
        {
          recipe: "equipItemByEnhancement",
          selector: normalizedSelector,
        },
      );
      return;
    }

    console.log(
      `Equipping item ${targetItem.name} (${targetItem.id}) for enhancement ${normalizedSelector.enhancement}`,
    );

    if (targetItem.isEquipped()) {
      return;
    }

    yield* deps.inventory.equip(targetItem.name);
  });

const validateEnhanceItemOptions = (
  deps: ScriptRecipeDependencies,
  options: ScriptEnhanceItemOptions,
) =>
  Effect.gen(function* () {
    const rawOptions = yield* requireObject(
      deps,
      "enhanceItem",
      "options",
      options,
    );
    const enhancement = yield* requireNonEmptyString(
      deps,
      "enhanceItem",
      "options.enhancement",
      rawOptions["enhancement"],
    );
    const rawSpecial = rawOptions["special"];
    const special =
      rawSpecial === undefined
        ? undefined
        : yield* requireNonEmptyString(
            deps,
            "enhanceItem",
            "options.special",
            rawSpecial,
          );

    return special === undefined ? { enhancement } : { enhancement, special };
  });

const enhanceItem = (
  deps: ScriptRecipeDependencies,
  item: string,
  options: ScriptEnhanceItemOptions,
): Effect.Effect<void, unknown> =>
  Effect.gen(function* () {
    const itemName = yield* requireNonEmptyString(
      deps,
      "enhanceItem",
      "item",
      item,
    );
    const { enhancement, special } = yield* validateEnhanceItemOptions(
      deps,
      options,
    );
    const playerLevel = yield* deps.player.getLevel();
    const itemRecord = yield* deps.inventory.getItem(itemName);
    if (!itemRecord) {
      yield* logRecipeWarning("Item not found in inventory", {
        recipe: "enhanceItem",
        enhancement,
        item: itemName,
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
      yield* logRecipeWarning(strategyResolution.reason, {
        recipe: "enhanceItem",
        enhancement,
        item: itemName,
        special,
      });
      return;
    }

    const strategy = strategyResolution.strategy;

    if (strategy.map !== undefined) {
      const currentMap = yield* deps.world.map.getName();
      if (!equalsIgnoreCase(currentMap, strategy.map)) {
        yield* deps.player.joinMap(strategy.map);
      }
    }

    yield* loadShopById(deps, strategy.shopId);

    const enhancementSelection = yield* findBestEnhancement(deps, strategy);
    if (!enhancementSelection.candidateData) {
      yield* logRecipeWarning(
        "No purchasable enhancement shop item matched requested strategy",
        {
          recipe: "enhanceItem",
          enhancement,
          item: itemName,
          memberEligibleCount: enhancementSelection.memberEligibleCount,
          special,
          shopItemCount: enhancementSelection.shopItemCount,
          shopId: strategy.shopId,
          slotAndPatternCount: enhancementSelection.slotAndPatternCount,
        },
      );
      return;
    }

    yield* deps.bridge.callGameFunction("world.confirmSendEnhItemRequestShop", {
      accept: true,
      enh: enhancementSelection.candidateData,
      item: [itemRecord.id],
    });

    yield* waitFor(
      deps.inventory
        .getItem(itemRecord.id)
        .pipe(
          Effect.map(
            (updatedItem) =>
              updatedItem !== null &&
              matchesAppliedEnhancement(updatedItem, strategy),
          ),
        ),
      { timeout: "5 seconds" },
    ).pipe(
      Effect.catch(() =>
        logRecipeWarning("Enhancement request did not apply in time", {
          recipe: "enhanceItem",
          enhancement,
          item: itemName,
          special,
          shopId: strategy.shopId,
          strategy,
        }),
      ),
    );
  });

export const makeScriptRecipes = (
  deps: ScriptRecipeDependencies,
): ScriptRecipesShape => ({
  buff: (skillList, wait) => buff(deps, skillList, wait),
  ensureLifeSteal: (quantity) => ensureLifeSteal(deps, quantity),
  ensureScrollOfEnrage: (quantity) => ensureScrollOfEnrage(deps, quantity),
  useConsumables: (items, equipAfter) =>
    useConsumables(deps, items, equipAfter),
  goToHouse: (player) => goToHouse(deps, player),
  beep: (times) => beep(deps, times),
  doWheelOfDoom: (toBank) => doWheelOfDoom(deps, toBank),
  waitForPlayerCount: (count, exact) => waitForPlayerCount(deps, count, exact),
  equipItemByEnhancement: (options) => equipItemByEnhancement(deps, options),
  enhanceItem: (item, options) => enhanceItem(deps, item, options),
});
