import type {
  EquipEnhancementSelector,
  EquipEnhancementSelectorSlot,
} from "@vexed/game";
import { Effect } from "effect";
import { ScriptInvalidArgumentError } from "../Errors";
import type { ScriptExecutionContext } from "../Types";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  readOptionalInstructionBoolean,
  readOptionalInstructionObject,
  readOptionalInstructionString,
  readOptionalScriptArgumentBoolean,
  readOptionalScriptArgumentObject,
  readOptionalScriptArgumentString,
  requireInstructionIdentifier,
  requireInstructionPositiveInteger,
  requireInstructionString,
  requireScriptArgumentIdentifier,
  requireScriptArgumentPositiveInteger,
  requireScriptArgumentString,
  type ScriptCommandDsl,
  type ScriptInstructionRecorder,
} from "./commandDsl";
import {
  buyItem,
  enhanceItem,
  equipItemByEnhancement,
  loadShopById,
  normalizeItemIdentifier,
  normalizeItemIdentifierList,
  rejectDrop,
  type EnhanceItemOptions,
} from "./itemOperations";

type ScriptItemIdentifier = string | number;
type ScriptItemIdentifierList =
  | ScriptItemIdentifier
  | ReadonlyArray<ScriptItemIdentifier>;
type EquipItemByEnhancementOptions = EquipEnhancementSelector;

type ItemScriptCommandArguments = {
  buy_item: [
    shopId: number,
    item: ScriptItemIdentifier,
    quantity: number,
    auto?: boolean,
  ];
  deposit: [item: ScriptItemIdentifierList];
  get_map_item: [itemId: number];
  pickup: [item: ScriptItemIdentifier];
  reject: [item: ScriptItemIdentifier];
  sell_item: [item: string];
  swap: [bankItem: ScriptItemIdentifier, invItem: ScriptItemIdentifier];
  withdraw: [item: ScriptItemIdentifierList];
  equip_item: [item: string];
  equip_item_by_enhancement: [options: EquipItemByEnhancementOptions];
  load_shop: [shopId: number];
  enhance_item: [item: string, options: EnhanceItemOptions];
};

type ItemScriptDsl = ScriptCommandDsl<ItemScriptCommandArguments>;
const itemCommandDomain =
  defineScriptCommandDomain<ItemScriptCommandArguments>();

const invalidItemArgument = (
  context: ScriptExecutionContext,
  command: string,
  message: string,
) =>
  Effect.fail(
    new ScriptInvalidArgumentError({
      sourceName: context.sourceName,
      command,
      message,
    }),
  );

const EQUIP_ENHANCEMENT_SELECTOR_SLOTS = [
  "weapon",
  "cape",
  "helm",
  "class",
  "armor",
] as const satisfies readonly EquipEnhancementSelectorSlot[];

const parseEquipEnhancementSelectorSlot = (
  value: string | undefined,
): EquipEnhancementSelectorSlot | undefined | null => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.toLowerCase().trim();
  return EQUIP_ENHANCEMENT_SELECTOR_SLOTS.includes(
    normalized as EquipEnhancementSelectorSlot,
  )
    ? (normalized as EquipEnhancementSelectorSlot)
    : null;
};

const normalizeEquipEnhancementSelectorSlot = (
  command: string,
  argName: string,
  value: string | undefined,
): EquipEnhancementSelectorSlot | undefined => {
  const slot = parseEquipEnhancementSelectorSlot(value);

  if (slot === null) {
    throw new Error(
      `cmd.${command}: ${argName} must be one of weapon, cape, helm, class`,
    );
  }

  return slot;
};

const readScriptEquipEnhancementOptions = (
  value: unknown,
): EquipItemByEnhancementOptions => {
  const command = "equip_item_by_enhancement";
  const options = readOptionalScriptArgumentObject<Record<string, unknown>>(
    command,
    "options",
    value,
  );

  if (options === undefined) {
    throw new Error(`cmd.${command}: options must be an object`);
  }

  const enhancement = requireScriptArgumentString(
    command,
    "options.enhancement",
    options["enhancement"],
  ).trim();
  const rawSlot = readOptionalScriptArgumentString(
    command,
    "options.slot",
    options["slot"],
  );
  const special = readOptionalScriptArgumentString(
    command,
    "options.special",
    options["special"],
  )?.trim();
  const slot = normalizeEquipEnhancementSelectorSlot(
    command,
    "options.slot",
    rawSlot,
  );

  return {
    enhancement,
    ...(slot ? { slot } : null),
    ...(special ? { special } : null),
  };
};

const readInstructionEquipEnhancementOptions = (
  context: ScriptExecutionContext,
  args: ReadonlyArray<unknown>,
) =>
  Effect.gen(function* () {
    const command = "equip_item_by_enhancement";
    const options = yield* readOptionalInstructionObject<
      Record<string, unknown>
    >(context, command, args, 0, "options");

    if (options === undefined) {
      return yield* invalidItemArgument(
        context,
        command,
        "options must be an object",
      );
    }

    const enhancement = (yield* requireInstructionString(
      context,
      command,
      [options["enhancement"]],
      0,
      "options.enhancement",
    )).trim();
    const rawSlot = yield* readOptionalInstructionString(
      context,
      command,
      [options["slot"]],
      0,
      "options.slot",
    );
    const special = (yield* readOptionalInstructionString(
      context,
      command,
      [options["special"]],
      0,
      "options.special",
    ))?.trim();

    const slot = parseEquipEnhancementSelectorSlot(rawSlot);
    if (slot === null) {
      return yield* invalidItemArgument(
        context,
        command,
        "options.slot must be one of weapon, cape, helm, class",
      );
    }

    return {
      enhancement,
      ...(slot ? { slot } : null),
      ...(special ? { special } : null),
    } satisfies EquipItemByEnhancementOptions;
  });

const readScriptEnhanceItemOptions = (value: unknown): EnhanceItemOptions => {
  const command = "enhance_item";
  const options = readOptionalScriptArgumentObject<Record<string, unknown>>(
    command,
    "options",
    value,
  );

  if (options === undefined) {
    throw new Error(`cmd.${command}: options must be an object`);
  }

  const enhancement = requireScriptArgumentString(
    command,
    "options.enhancement",
    options["enhancement"],
  ).trim();
  const special = readOptionalScriptArgumentString(
    command,
    "options.special",
    options["special"],
  )?.trim();

  return {
    enhancement,
    ...(special ? { special } : null),
  };
};

const readInstructionEnhanceItemOptions = (
  context: ScriptExecutionContext,
  args: ReadonlyArray<unknown>,
) =>
  Effect.gen(function* () {
    const command = "enhance_item";
    const options = yield* readOptionalInstructionObject<
      Record<string, unknown>
    >(context, command, args, 1, "options");

    if (options === undefined) {
      return yield* invalidItemArgument(
        context,
        command,
        "options must be an object",
      );
    }

    const enhancement = (yield* requireInstructionString(
      context,
      command,
      [options["enhancement"]],
      0,
      "options.enhancement",
    )).trim();
    const special = (yield* readOptionalInstructionString(
      context,
      command,
      [options["special"]],
      0,
      "options.special",
    ))?.trim();

    return {
      enhancement,
      ...(special ? { special } : null),
    } satisfies EnhanceItemOptions;
  });

const requireInstructionItemIdentifier = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) =>
  Effect.map(
    requireInstructionIdentifier(context, command, args, index, argName),
    normalizeItemIdentifier,
  );

const requireInstructionItemIdentifierList = (
  context: ScriptExecutionContext,
  command: string,
  args: ReadonlyArray<unknown>,
  index: number,
  argName: string,
) => {
  const value = args[index];
  if (!Array.isArray(value)) {
    return requireInstructionItemIdentifier(
      context,
      command,
      args,
      index,
      argName,
    );
  }

  if (value.length === 0) {
    return invalidItemArgument(
      context,
      command,
      `${argName} must contain at least one item`,
    );
  }

  return Effect.forEach(value, (_item, itemIndex) =>
    requireInstructionItemIdentifier(
      context,
      command,
      value,
      itemIndex,
      `${argName}[${itemIndex}]`,
    ),
  );
};

const requireScriptItemIdentifier = (
  command: string,
  argName: string,
  value: unknown,
): ScriptItemIdentifier =>
  normalizeItemIdentifier(
    requireScriptArgumentIdentifier(command, argName, value),
  );

const requireScriptItemIdentifierList = (
  command: string,
  argName: string,
  value: unknown,
): ScriptItemIdentifierList => {
  if (!Array.isArray(value)) {
    return requireScriptItemIdentifier(command, argName, value);
  }

  if (value.length === 0) {
    throw new Error(
      `cmd.${command}: ${argName} must contain at least one item`,
    );
  }

  return normalizeItemIdentifierList(
    value.map((item, itemIndex) =>
      requireScriptArgumentIdentifier(
        command,
        `${argName}[${itemIndex}]`,
        item,
      ),
    ),
  );
};

const buyItemCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const shopId = yield* requireInstructionPositiveInteger(
      context,
      "buy_item",
      args,
      0,
      "shop_id",
    );
    const item = yield* requireInstructionItemIdentifier(
      context,
      "buy_item",
      args,
      1,
      "item",
    );
    const quantity = yield* requireInstructionPositiveInteger(
      context,
      "buy_item",
      args,
      2,
      "quantity",
    );
    const auto = yield* readOptionalInstructionBoolean(
      context,
      "buy_item",
      args,
      3,
      "auto",
    );

    yield* buyItem(context, shopId, item, quantity, auto ?? false);
  }),
);

const depositCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const item = yield* requireInstructionItemIdentifierList(
      context,
      "deposit",
      args,
      0,
      "item",
    );

    if (Array.isArray(item)) {
      yield* context.run(context.bank.depositMany(...item));
      return;
    }

    yield* context.run(context.bank.deposit(item));
  }),
);

const getMapItemCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const itemId = yield* requireInstructionPositiveInteger(
      context,
      "get_map_item",
      args,
      0,
      "item_id",
    );
    yield* context.run(context.world.map.getMapItem(itemId));
  }),
);

const pickupCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const item = yield* requireInstructionItemIdentifier(
      context,
      "pickup",
      args,
      0,
      "item",
    );
    yield* context.run(context.drops.acceptDrop(item));
  }),
);

const rejectCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const item = yield* requireInstructionItemIdentifier(
      context,
      "reject",
      args,
      0,
      "item",
    );
    yield* rejectDrop(context, item);
  }),
);

const sellItemCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const item = yield* requireInstructionString(
      context,
      "sell_item",
      args,
      0,
      "item",
    );
    yield* context.run(context.shops.sellByName(item));
  }),
);

const swapCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const bankItem = yield* requireInstructionItemIdentifier(
      context,
      "swap",
      args,
      0,
      "bank_item",
    );
    const invItem = yield* requireInstructionItemIdentifier(
      context,
      "swap",
      args,
      1,
      "inv_item",
    );
    yield* context.run(context.bank.swap(invItem, bankItem));
  }),
);

const withdrawCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const item = yield* requireInstructionItemIdentifierList(
      context,
      "withdraw",
      args,
      0,
      "item",
    );

    if (Array.isArray(item)) {
      yield* context.run(context.bank.withdrawMany(...item));
      return;
    }

    yield* context.run(context.bank.withdraw(item));
  }),
);

const equipItemCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const item = yield* requireInstructionString(
      context,
      "equip_item",
      args,
      0,
      "item",
    );
    yield* context.run(context.inventory.equip(item));
  }),
);

const equipItemByEnhancementCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const options = yield* readInstructionEquipEnhancementOptions(
      context,
      args,
    );

    yield* equipItemByEnhancement(context, options);
  }),
);

const loadShopCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const shopId = yield* requireInstructionPositiveInteger(
      context,
      "load_shop",
      args,
      0,
      "shop_id",
    );
    yield* loadShopById(context, shopId);
  }),
);

const enhanceItemCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const item = yield* requireInstructionString(
      context,
      "enhance_item",
      args,
      0,
      "item",
    );
    const options = yield* readInstructionEnhanceItemOptions(context, args);

    yield* enhanceItem(context, item.trim(), options);
  }),
);

const itemCommandHandlerMap = itemCommandDomain.defineHandlers({
  buy_item: buyItemCommand,
  deposit: depositCommand,
  get_map_item: getMapItemCommand,
  pickup: pickupCommand,
  reject: rejectCommand,
  sell_item: sellItemCommand,
  swap: swapCommand,
  withdraw: withdrawCommand,
  equip_item: equipItemCommand,
  equip_item_by_enhancement: equipItemByEnhancementCommand,
  load_shop: loadShopCommand,
  enhance_item: enhanceItemCommand,
});

export const itemCommandHandlers = itemCommandDomain.handlerEntries(
  itemCommandHandlerMap,
);

export const createItemScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): ItemScriptDsl => {
  const recordItemInstruction =
    itemCommandDomain.createInstructionRecorder(recordInstruction);

  return {
    /**
     * Buys an item from a shop.
     *
     * @param shopId - Shop id to load or use.
     * @param item - Item name or item id.
     * @param quantity - Quantity to buy.
     * @param auto - Whether merge requirements should be bought first when possible.
     * @example
     * cmd.buy_item(147, "Health Potion", 5)
     */
    buy_item(
      shopId: number,
      item: ScriptItemIdentifier,
      quantity: number,
      auto: boolean = false,
    ) {
      recordItemInstruction(
        "buy_item",
        requireScriptArgumentPositiveInteger("buy_item", "shop_id", shopId),
        requireScriptItemIdentifier("buy_item", "item", item),
        requireScriptArgumentPositiveInteger("buy_item", "quantity", quantity),
        readOptionalScriptArgumentBoolean("buy_item", "auto", auto) ?? false,
      );
    },

    /**
     * Deposits one or more items into the bank.
     *
     * @param item - Item name, item id, or list of items.
     * @example
     * cmd.deposit("Voucher")
     * @example
     * cmd.deposit(["Voucher", "Merge Token"])
     */
    deposit(item: ScriptItemIdentifierList) {
      recordItemInstruction(
        "deposit",
        requireScriptItemIdentifierList("deposit", "item", item),
      );
    },

    /**
     * Picks up a map item by id.
     *
     * @param itemId - Map item id.
     */
    get_map_item(itemId: number) {
      recordItemInstruction(
        "get_map_item",
        requireScriptArgumentPositiveInteger("get_map_item", "item_id", itemId),
      );
    },

    /**
     * Accepts a dropped item.
     *
     * @param item - Item name or item id.
     */
    pickup(item: ScriptItemIdentifier) {
      recordItemInstruction(
        "pickup",
        requireScriptItemIdentifier("pickup", "item", item),
      );
    },

    /**
     * Rejects a dropped item.
     *
     * @param item - Item name or item id.
     */
    reject(item: ScriptItemIdentifier) {
      recordItemInstruction(
        "reject",
        requireScriptItemIdentifier("reject", "item", item),
      );
    },

    /**
     * Sells an inventory item by name.
     *
     * @param item - Inventory item name.
     */
    sell_item(item: string) {
      recordItemInstruction(
        "sell_item",
        requireScriptArgumentString("sell_item", "item", item),
      );
    },

    /**
     * Swaps a bank item with an inventory item.
     *
     * @param bankItem - Item currently in the bank.
     * @param invItem - Item currently in inventory.
     * @example
     * cmd.swap("Farming Class", "Combat Class")
     */
    swap(bankItem: ScriptItemIdentifier, invItem: ScriptItemIdentifier) {
      recordItemInstruction(
        "swap",
        requireScriptItemIdentifier("swap", "bank_item", bankItem),
        requireScriptItemIdentifier("swap", "inv_item", invItem),
      );
    },

    /**
     * Withdraws one or more items from the bank.
     *
     * @param item - Item name, item id, or list of items.
     * @example
     * cmd.withdraw("Voucher")
     * @example
     * cmd.withdraw(["Voucher", "Merge Token"])
     */
    withdraw(item: ScriptItemIdentifierList) {
      recordItemInstruction(
        "withdraw",
        requireScriptItemIdentifierList("withdraw", "item", item),
      );
    },

    /**
     * Equips an inventory item by name.
     *
     * @param item - Inventory item name.
     */
    equip_item(item: string) {
      recordItemInstruction(
        "equip_item",
        requireScriptArgumentString("equip_item", "item", item),
      );
    },

    /**
     * Equips the first inventory item matching an enhancement rule.
     *
     * @param options - Enhancement selector. `slot` may be `weapon`, `cape`, `helm`, or `class`; `special` selects a weapon special or Forge cape/helm special.
     * @param options.enhancement - Enhancement name to match.
     * @param options.slot - Equipment slot to match.
     * @param options.special - Weapon special or Forge cape/helm special to match.
     * @example
     * cmd.equip_item_by_enhancement({ enhancement: "Forge", slot: "helm" })
     * @example
     * cmd.equip_item_by_enhancement({ enhancement: "Forge", slot: "helm", special: "Vim" })
     * @example
     * cmd.equip_item_by_enhancement({ enhancement: "Forge", slot: "weapon", special: "Valiance" })
     * @example
     * cmd.equip_item_by_enhancement({ enhancement: "Lucky", slot: "weapon" })
     * @example
     * cmd.equip_item_by_enhancement({ enhancement: "Lucky", special: "Awe Blast" })
     */
    equip_item_by_enhancement(options: EquipItemByEnhancementOptions) {
      recordItemInstruction(
        "equip_item_by_enhancement",
        readScriptEquipEnhancementOptions(options),
      );
    },

    /**
     * Loads a shop.
     *
     * @param shopId - Shop id to load.
     */
    load_shop(shopId: number) {
      recordItemInstruction(
        "load_shop",
        requireScriptArgumentPositiveInteger("load_shop", "shop_id", shopId),
      );
    },

    /**
     * Enhances an inventory item using a matching enhancement shop entry.
     *
     * @param item - Inventory item name.
     * @param options - Enhancement request.
     * @param options.enhancement - Enhancement name such as `Lucky` or `Forge`.
     * @param options.special - Optional Awe or Forge special name, such as `Valiance`; popular shorthands like `val` are also supported. See the {@source packages/game/src/util/enhancements.ts:318 enhancements.ts:318 alias source}.
     * @example
     * cmd.enhance_item("Sword", { enhancement: "Wizard" })
     * @example
     * cmd.enhance_item("Sword", { enhancement: "Wizard", special: "Awe Blast" })
     * @example
     * cmd.enhance_item("Necrotic Sword", { enhancement: "Forge", special: "Valiance" })
     */
    enhance_item(item: string, options: EnhanceItemOptions) {
      recordItemInstruction(
        "enhance_item",
        requireScriptArgumentString("enhance_item", "item", item).trim(),
        readScriptEnhanceItemOptions(options),
      );
    },
  };
};
