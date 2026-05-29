import type { AvatarData } from "@vexed/game";
import { Data, Effect, Layer, Option } from "effect";
import { expect, test } from "vitest";
import { Auth, type AuthShape } from "../Services/Auth";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import {
  PacketDomain,
  type PacketDomainEventMap,
  type PacketDomainShape,
} from "../Services/PacketDomain";
import { World, type WorldShape } from "../Services/World";
import { PacketLive } from "./Packet";
import { PacketDomainLive } from "./PacketDomain";
import { WaitLive } from "./Wait";
import { WorldLive } from "./World";
import { LOOP_TAUNT_SCROLL_ITEM_ID } from "../../../../../shared/loop-taunt";

type PacketWindow = Pick<
  Window,
  "onExtensionResponse" | "packetFromClient" | "packetFromServer"
>;

class PacketDomainTestError extends Data.TaggedError("PacketDomainTestError")<{
  readonly cause?: unknown;
  readonly message: string;
}> {}

const bridge = {
  call<K extends keyof Window["swf"]>(
    _path: K,
    _args?: Parameters<Window["swf"][K]>,
  ) {
    return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
  },
  callGameFunction(_functionName: string, ..._args: ReadonlyArray<unknown>) {
    return Effect.void;
  },
  onConnection(_handler: (status: ConnectionStatus) => void) {
    return Effect.succeed(() => undefined);
  },
} satisfies BridgeShape;

const auth = {
  connectTo: () =>
    Effect.succeed({
      message: "connected",
      retryable: false,
      status: "connected",
    } as const),
  getServers: () => Effect.succeed([]),
  getUsername: () => Effect.succeed("Main"),
  getPassword: () => Effect.succeed("password"),
  getLoginSession: () =>
    Effect.succeed({
      bSuccess: 1,
      iUpg: 0,
      servers: [],
      sToken: "password",
      unm: "Main",
    }),
  isLoggedIn: () => Effect.succeed(true),
  isTemporarilyKicked: () => Effect.succeed(false),
  login: () => Effect.void,
  logout: () => Effect.void,
} satisfies AuthShape;

const bridgeLayer = Layer.succeed(Bridge)(bridge);
const waitRuntimeLayer = WaitLive.pipe(Layer.provide(bridgeLayer));
const packetRuntimeLayer = PacketLive.pipe(Layer.provide(bridgeLayer));
const worldRuntimeLayer = WorldLive.pipe(
  Layer.provide(Layer.mergeAll(bridgeLayer, waitRuntimeLayer)),
);
const coreRuntimeLayer = Layer.mergeAll(
  waitRuntimeLayer,
  packetRuntimeLayer,
  worldRuntimeLayer,
  Layer.succeed(Auth)(auth),
);
const packetDomainRuntimeLayer = PacketDomainLive.pipe(
  Layer.provide(coreRuntimeLayer),
);
const runtimeLayer = Layer.mergeAll(coreRuntimeLayer, packetDomainRuntimeLayer);

const withPacketDomain = async <A>(
  body: (
    packetDomain: PacketDomainShape,
    world: WorldShape,
  ) => Effect.Effect<A, unknown>,
): Promise<A> => {
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const testWindow = {} as Window;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: testWindow,
  });

  try {
    return await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const packetDomain = yield* PacketDomain;
          const world = yield* World;
          return yield* body(packetDomain, world);
        }),
      ).pipe(Effect.provide(runtimeLayer)),
    );
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
};

const avatar = (
  username: string,
  overrides: Partial<AvatarData> = {},
): AvatarData => ({
  afk: false,
  entID: 2,
  entType: "player",
  intHP: 100,
  intHPMax: 100,
  intLevel: 100,
  intMP: 100,
  intMPMax: 100,
  intState: 1,
  strFrame: "Enter",
  strPad: "Spawn",
  strUsername: username,
  tx: 100,
  ty: 100,
  uoName: username.toLowerCase(),
  ...overrides,
});

const emitServerPacket = (raw: string): void => {
  const handler = (window as PacketWindow).packetFromServer;
  if (typeof handler !== "function") {
    throw new PacketDomainTestError({
      message: "window.packetFromServer was not registered",
    });
  }

  handler(raw);
};

const emitClientPacket = (raw: string): void => {
  const handler = (window as PacketWindow).packetFromClient;
  if (typeof handler !== "function") {
    throw new PacketDomainTestError({
      message: "window.packetFromClient was not registered",
    });
  }

  handler(raw);
};

const emitExtensionPacket = (raw: string): void => {
  const handler = (window as PacketWindow).onExtensionResponse;
  if (typeof handler !== "function") {
    throw new PacketDomainTestError({
      message: "window.onExtensionResponse was not registered",
    });
  }

  handler(raw);
};

const waitForEvent = <A>(promise: Promise<A>) =>
  Effect.tryPromise({
    try: () =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new PacketDomainTestError({
                  message: "timed out waiting for event",
                }),
              ),
            500,
          );
        }),
      ]),
    catch: (cause) =>
      cause instanceof PacketDomainTestError
        ? cause
        : new PacketDomainTestError({
            cause,
            message: "event wait failed",
          }),
  });

test("packet domain updates remote player position from uotls move packets", async () => {
  const result = await withPacketDomain((packetDomain, world) =>
    Effect.gen(function* () {
      yield* world.players.add(avatar("Hero"));
      let resolveLocation:
        | ((event: PacketDomainEventMap["playerLocation"]) => void)
        | undefined;
      const observedLocation = new Promise<
        PacketDomainEventMap["playerLocation"]
      >((resolve) => {
        resolveLocation = resolve;
      });

      yield* packetDomain.on("playerLocation", (event) =>
        Effect.sync(() => resolveLocation?.(event)),
      );

      emitExtensionPacket(
        JSON.stringify({
          params: {
            dataObj: [
              "uotls",
              "-1",
              "Hero",
              "tx:464,ty:445,sp:8,strFrame:Enter",
            ],
            type: "str",
          },
        }),
      );
      yield* Effect.sleep("10 millis");

      const player = yield* world.players.getByName("Hero");
      if (Option.isNone(player)) {
        throw new PacketDomainTestError({ message: "player was not found" });
      }

      return {
        data: player.value.data,
        event: yield* waitForEvent(observedLocation),
      };
    }),
  );

  expect(result.data.strFrame).toBe("Enter");
  expect(result.data.tx).toBe(464);
  expect(result.data.ty).toBe(445);
  expect(result.event).toMatchObject({
    username: "Hero",
    cell: "Enter",
    x: 464,
    y: 445,
  });
});

test("packet domain updates remote player cell from uotls cell-change packets", async () => {
  const data = await withPacketDomain((_packetDomain, world) =>
    Effect.gen(function* () {
      yield* world.players.add(avatar("Hero"));

      emitExtensionPacket(
        JSON.stringify({
          params: {
            dataObj: [
              "uotls",
              "-1",
              "Hero",
              "strFrame:R2,strPad:Left,px:500,py:375,mvts:-1,mvtd:0,tx:0,ty:0,bResting:false",
            ],
            type: "str",
          },
        }),
      );
      yield* Effect.sleep("10 millis");

      const player = yield* world.players.getByName("Hero");
      if (Option.isNone(player)) {
        throw new PacketDomainTestError({ message: "player was not found" });
      }

      return player.value.data;
    }),
  );

  expect(data.strFrame).toBe("R2");
  expect(data.strPad).toBe("Left");
  expect(data.tx).toBe(500);
  expect(data.ty).toBe(375);
});

test("packet domain emits animation message events with monster ids", async () => {
  const event = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      let resolveEvent:
        | ((event: PacketDomainEventMap["animationMessage"]) => void)
        | undefined;
      const observed = new Promise<PacketDomainEventMap["animationMessage"]>(
        (resolve) => {
          resolveEvent = resolve;
        },
      );

      yield* packetDomain.on("animationMessage", (messageEvent) =>
        Effect.sync(() => resolveEvent?.(messageEvent)),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","anims":[{"msg":"defense shattering","cInf":"m:3","tInf":"m:2"}]}}}',
      );

      return yield* waitForEvent(observed);
    }),
  );

  expect(event.message).toBe("defense shattering");
  expect(event.monMapId).toBe(3);
  expect(event.sourceMonMapId).toBe(3);
  expect(event.targetMonMapId).toBe(2);
});

test("packet domain preserves animation message target monster id fallback", async () => {
  const event = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      let resolveEvent:
        | ((event: PacketDomainEventMap["animationMessage"]) => void)
        | undefined;
      const observed = new Promise<PacketDomainEventMap["animationMessage"]>(
        (resolve) => {
          resolveEvent = resolve;
        },
      );

      yield* packetDomain.on("animationMessage", (messageEvent) =>
        Effect.sync(() => resolveEvent?.(messageEvent)),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","anims":[{"msg":"defense shattering","tInf":"m:2"}]}}}',
      );

      return yield* waitForEvent(observed);
    }),
  );

  expect(event.message).toBe("defense shattering");
  expect(event.monMapId).toBe(2);
  expect(event.sourceMonMapId).toBeUndefined();
  expect(event.targetMonMapId).toBe(2);
});

test("packet domain parses monster ids from animation target lists", async () => {
  const event = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      let resolveEvent:
        | ((event: PacketDomainEventMap["animationMessage"]) => void)
        | undefined;
      const observed = new Promise<PacketDomainEventMap["animationMessage"]>(
        (resolve) => {
          resolveEvent = resolve;
        },
      );

      yield* packetDomain.on("animationMessage", (messageEvent) =>
        Effect.sync(() => resolveEvent?.(messageEvent)),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","anims":[{"msg":"defense shattering","cInf":"p:1","tInf":"p:2,m:4,m:5"}]}}}',
      );

      return yield* waitForEvent(observed);
    }),
  );

  expect(event.message).toBe("defense shattering");
  expect(event.monMapId).toBe(4);
  expect(event.sourceMonMapId).toBeUndefined();
  expect(event.targetMonMapId).toBe(4);
});

test("packet domain emits monster aura add and remove events", async () => {
  const events = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      const observed: Array<PacketDomainEventMap["auraAdded" | "auraRemoved"]> =
        [];
      let resolveEvents:
        | ((
            events: Array<PacketDomainEventMap["auraAdded" | "auraRemoved"]>,
          ) => void)
        | undefined;
      const done = new Promise<
        Array<PacketDomainEventMap["auraAdded" | "auraRemoved"]>
      >((resolve) => {
        resolveEvents = resolve;
      });

      const pushEvent = (
        event: PacketDomainEventMap["auraAdded" | "auraRemoved"],
      ) => {
        observed.push(event);
        if (observed.length === 2) {
          resolveEvents?.(observed);
        }
      };

      yield* packetDomain.on("auraAdded", (event) =>
        Effect.sync(() => pushEvent(event)),
      );
      yield* packetDomain.on("auraRemoved", (event) =>
        Effect.sync(() => pushEvent(event)),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","a":[{"cmd":"aura+","tInf":"m:2","auras":[{"cat":"stone","icon":"iwd1,ied1","isNew":true,"nam":"Focus"}]},{"cmd":"aura-","tInf":"m:2","aura":{"nam":"Focus"}}]}}}',
      );

      return yield* waitForEvent(done);
    }),
  );

  expect(events).toMatchObject([
    {
      aura: { cat: "stone", icon: "iwd1,ied1" },
      auraName: "Focus",
      targetId: 2,
      targetType: "monster",
    },
    { auraName: "Focus", targetId: 2, targetType: "monster" },
  ]);
});

test("packet domain reports outgoing loop taunt scroll attempt telemetry", async () => {
  const event = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      let resolveObserved: (
        event: PacketDomainEventMap["loopTauntClientCastAttempt"],
      ) => void;
      const observed = new Promise<
        PacketDomainEventMap["loopTauntClientCastAttempt"]
      >((resolve) => {
        resolveObserved = resolve;
      });
      yield* packetDomain.on("loopTauntClientCastAttempt", (payload) =>
        Effect.sync(() => resolveObserved(payload)),
      );

      emitClientPacket("%xt%zm%gar%1%0%i1>m:7%12917%wvz%");

      return yield* waitForEvent(observed);
    }),
  );

  expect(event.itemId).toBe(LOOP_TAUNT_SCROLL_ITEM_ID);
  expect(event.monMapId).toBe(7);
});

test("packet domain reports server-confirmed loop taunt actions with matching Focus aura", async () => {
  const event = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      let resolveObserved: (
        event: PacketDomainEventMap["loopTauntServerCastConfirmed"],
      ) => void;
      const observed = new Promise<
        PacketDomainEventMap["loopTauntServerCastConfirmed"]
      >((resolve) => {
        resolveObserved = resolve;
      });
      yield* packetDomain.on("loopTauntServerCastConfirmed", (payload) =>
        Effect.sync(() => resolveObserved(payload)),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","sarsa":[{"a":[{"actRef":"i1","tInf":"m:7"}]}],"a":[{"cmd":"aura+","tInf":"m:7","auras":[{"nam":"Focus","icon":"iwd1,ied1","dur":6,"t":"s","isNew":true}]}]}}}',
      );

      return yield* waitForEvent(observed);
    }),
  );

  expect(event.auraIcon).toBe("iwd1,ied1");
  expect(event.auraName).toBe("Focus");
  expect(event.monMapId).toBe(7);
});

test("packet domain does not confirm loop taunt from server action without matching Focus aura", async () => {
  const observed = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      let observed = false;
      yield* packetDomain.on("loopTauntServerCastConfirmed", () =>
        Effect.sync(() => {
          observed = true;
        }),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","sarsa":[{"a":[{"actRef":"i1","tInf":"m:7"}]}]}}}',
      );
      yield* Effect.sleep("25 millis");

      return observed;
    }),
  );

  expect(observed).toBe(false);
});
