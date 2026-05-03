import { Item, type ItemData } from "@vexed/game";
import { Effect } from "effect";
import { expect, test } from "vitest";
import type { ExtensionPacketHandler } from "../../flash/Services/Packet";
import { scriptCommandHandlers } from ".";
import { ScriptInvalidArgumentError } from "../Errors";
import type { ScriptExecutionContext, ScriptInstruction } from "../Types";

const wheelOfDoomHandler = () => {
  const handler = scriptCommandHandlers.find(
    ([name]) => name === "do_wheelofdoom",
  )?.[1];
  if (!handler) {
    throw new Error("do_wheelofdoom handler not found");
  }

  return handler;
};

const useConsumablesHandler = () => {
  const handler = scriptCommandHandlers.find(
    ([name]) => name === "use_consumables",
  )?.[1];
  if (!handler) {
    throw new Error("use_consumables handler not found");
  }

  return handler;
};

const itemData = (itemId: number, name: string, quantity = 1): ItemData =>
  ({
    ItemID: itemId,
    iQty: quantity,
    sName: name,
  }) as ItemData;

const wheelInstruction = (toBank: boolean): ScriptInstruction => ({
  args: [toBank],
  index: 0,
  name: "do_wheelofdoom",
});

const useConsumablesInstruction = (
  items: string | readonly string[],
  equipAfter?: string,
): ScriptInstruction => ({
  args: equipAfter === undefined ? [items] : [items, equipAfter],
  index: 0,
  name: "use_consumables",
});

const createWheelContext = (
  options: {
    readonly emitWheelPacket?: boolean;
    readonly inventoryHasGear?: boolean;
    readonly wheelPayload?: Record<string, unknown>;
  } = {},
) => {
  const calls: string[] = [];
  const deposits: ItemIdentifierToken[] = [];
  let wheelHandler: ExtensionPacketHandler | undefined;
  let disposerCalls = 0;

  const context = {
    sourceName: "misc.test.ts",
    signal: new AbortController().signal,
    isCancelled: () => false,
    inventory: {
      contains: (item: ItemIdentifierToken, quantity?: number) =>
        Effect.sync(() => {
          calls.push(`inventory.contains:${String(item)}:${quantity ?? ""}`);
          return options.inventoryHasGear ?? true;
        }),
    },
    bank: {
      contains: (item: ItemIdentifierToken, quantity?: number) =>
        Effect.sync(() => {
          calls.push(`bank.contains:${String(item)}:${quantity ?? ""}`);
          return true;
        }),
      deposit: (item: ItemIdentifierToken) =>
        Effect.sync(() => {
          calls.push(`bank.deposit:${String(item)}`);
          deposits.push(item);
          return true;
        }),
      depositMany: (...items: ItemIdentifierToken[]) =>
        Effect.sync(() => {
          calls.push(`bank.depositMany:${items.map(String).join(",")}`);
          deposits.push(...items);
        }),
      open: (force?: boolean) =>
        Effect.sync(() => {
          calls.push(`bank.open:${force === true}`);
        }),
      withdraw: (item: ItemIdentifierToken) =>
        Effect.sync(() => {
          calls.push(`bank.withdraw:${String(item)}`);
          return true;
        }),
    },
    packet: {
      json: (cmd: string, handler: ExtensionPacketHandler) =>
        Effect.sync(() => {
          calls.push(`packet.json:${cmd}`);
          wheelHandler = handler;
          return () => {
            calls.push(`packet.dispose:${cmd}`);
            disposerCalls += 1;
          };
        }),
    },
    player: {
      joinMap: (map: string) =>
        Effect.sync(() => {
          calls.push(`player.joinMap:${map}`);
        }),
    },
    quests: {
      accept: (questId: number, silent?: boolean) =>
        Effect.sync(() => {
          calls.push(`quests.accept:${questId}:${silent === true}`);
        }),
      canComplete: (questId: number) =>
        Effect.sync(() => {
          calls.push(`quests.canComplete:${questId}`);
          return true;
        }),
      complete: (questId: number) =>
        Effect.gen(function* () {
          calls.push(`quests.complete:${questId}`);
          if (options.emitWheelPacket !== false && wheelHandler) {
            yield* wheelHandler({
              cmd: "Wheel",
              data: options.wheelPayload ?? {},
              packetType: "json",
              raw: "",
              type: "extension",
            });
          }
        }),
    },
  } as unknown as ScriptExecutionContext;

  return {
    calls,
    context,
    deposits,
    get disposerCalls() {
      return disposerCalls;
    },
    get wheelHandler() {
      return wheelHandler;
    },
  };
};

const createUseConsumablesContext = (options: {
  readonly activeSkillItems: ReadonlyArray<{ itemId?: number; name?: string }>;
  readonly equipResult?: boolean;
  readonly items: ReadonlyArray<Item>;
}) => {
  const calls: string[] = [];
  const diagnostics: unknown[] = [];
  let activeSkillItemIndex = 0;
  const itemsByName = new Map(
    options.items.map((item) => [item.name.toLowerCase(), item]),
  );

  const context = {
    sourceName: "misc.test.ts",
    signal: new AbortController().signal,
    isCancelled: () => false,
    notify: (diagnostic: unknown) =>
      Effect.sync(() => {
        diagnostics.push(diagnostic);
      }),
    combat: {
      getActiveSkillItem: (index: number | string) =>
        Effect.sync(() => {
          calls.push(`combat.getActiveSkillItem:${String(index)}`);
          const activeItem =
            options.activeSkillItems[
              Math.min(
                activeSkillItemIndex,
                options.activeSkillItems.length - 1,
              )
            ] ?? null;
          activeSkillItemIndex += 1;
          return activeItem;
        }),
      useSkill: (index: number | string, force?: boolean, wait?: boolean) =>
        Effect.sync(() => {
          calls.push(
            `combat.useSkill:${String(index)}:${force === true}:${wait === true}`,
          );
        }),
    },
    inventory: {
      equip: (item: ItemIdentifierToken) =>
        Effect.sync(() => {
          calls.push(`inventory.equip:${String(item)}`);
          return options.equipResult ?? true;
        }),
      getItem: (item: ItemIdentifierToken) =>
        Effect.sync(() => {
          calls.push(`inventory.getItem:${String(item)}`);
          return itemsByName.get(String(item).toLowerCase()) ?? null;
        }),
    },
  } as unknown as ScriptExecutionContext;

  return {
    calls,
    context,
    diagnostics,
  };
};

test("banks rewards reported by Wheel packet and disposes the packet handler", async () => {
  const fixture = createWheelContext({
    wheelPayload: {
      Item: itemData(3, "Singular Reward"),
      dropItems: {
        "1": itemData(1, "Packet Reward"),
        "2": itemData(2, "Treasure Potion"),
      },
    },
  });

  await Effect.runPromise(
    wheelOfDoomHandler()(fixture.context, wheelInstruction(true)),
  );

  expect(fixture.calls.indexOf("packet.json:Wheel")).toBeLessThan(
    fixture.calls.indexOf("quests.complete:3076"),
  );
  expect(fixture.wheelHandler).toBeDefined();
  expect(fixture.deposits).toEqual(["Packet Reward", "Singular Reward"]);
  expect(fixture.deposits).not.toContain("Gear of Doom");
  expect(fixture.calls).toContain("packet.dispose:Wheel");
  expect(fixture.disposerCalls).toBe(1);
});

test("does not register Wheel packet handler or bank rewards when toBank is false", async () => {
  const fixture = createWheelContext({
    wheelPayload: {
      dropItems: {
        "1": itemData(1, "Packet Reward"),
      },
    },
  });

  await Effect.runPromise(
    wheelOfDoomHandler()(fixture.context, wheelInstruction(false)),
  );

  expect(fixture.calls).not.toContain("packet.json:Wheel");
  expect(fixture.wheelHandler).toBeUndefined();
  expect(fixture.deposits).toEqual([]);
  expect(fixture.disposerCalls).toBe(0);
});

test("use_consumables casts only after slot 5 matches by item id or name", async () => {
  const fixture = createUseConsumablesContext({
    activeSkillItems: [
      { itemId: 1001, name: "Different Display Name" },
      { name: "potent honor potion" },
    ],
    items: [
      new Item(itemData(1001, "Body Tonic")),
      new Item(itemData(1002, "Potent Honor Potion")),
    ],
  });

  await Effect.runPromise(
    useConsumablesHandler()(
      fixture.context,
      useConsumablesInstruction(
        ["Body Tonic", "Potent Honor Potion"],
        "Main Class",
      ),
    ),
  );

  expect(fixture.calls).toEqual([
    "inventory.getItem:Body Tonic",
    "inventory.equip:Body Tonic",
    "combat.getActiveSkillItem:5",
    "combat.useSkill:5:true:true",
    "inventory.getItem:Potent Honor Potion",
    "inventory.equip:Potent Honor Potion",
    "combat.getActiveSkillItem:5",
    "combat.useSkill:5:true:true",
    "inventory.equip:Main Class",
  ]);
});

test("use_consumables fails closed when slot 5 does not match the equipped item", async () => {
  const fixture = createUseConsumablesContext({
    activeSkillItems: [{ itemId: 9999, name: "Wrong Potion" }],
    items: [new Item(itemData(1001, "Body Tonic"))],
  });

  await expect(
    Effect.runPromise(
      useConsumablesHandler()(
        fixture.context,
        useConsumablesInstruction("Body Tonic"),
      ),
    ),
  ).rejects.toBeInstanceOf(ScriptInvalidArgumentError);

  expect(fixture.calls).toContain("inventory.equip:Body Tonic");
  expect(fixture.calls).not.toContain("combat.useSkill:5:true:true");
  expect(fixture.diagnostics).toEqual([
    {
      command: "use_consumables",
      instructionIndex: 0,
      severity: "error",
      message: 'Consumable "Body Tonic" did not appear in slot 5.',
    },
  ]);
});
