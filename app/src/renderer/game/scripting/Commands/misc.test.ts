import type { ItemData } from "@vexed/game";
import { Effect } from "effect";
import { expect, test } from "vitest";
import type { ExtensionPacketHandler } from "../../flash/Services/Packet";
import { scriptCommandHandlers } from ".";
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
