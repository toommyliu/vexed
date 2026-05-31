import type { AvatarData, MonsterData } from "@vexed/game";
import { Data, Effect, Layer, Option } from "effect";
import { expect, test } from "vitest";
import { Auth, type AuthShape } from "../Services/Auth";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import {
  GameEvents,
  type GameEventMap,
  type GameEventsShape,
} from "../Services/GameEvents";
import { World, type WorldShape } from "../Services/World";
import { PacketLive } from "./Packet";
import { GameEventProjectorLive } from "./GameEventProjector";
import { GameEventsLive } from "./GameEvents";
import { WaitLive } from "./Wait";
import { WorldLive } from "./World";

type PacketWindow = Pick<
  Window,
  "onExtensionResponse" | "packetFromClient" | "packetFromServer"
>;

class GameEventsTestError extends Data.TaggedError("GameEventsTestError")<{
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
const authLayer = Layer.succeed(Auth)(auth);
const waitRuntimeLayer = WaitLive.pipe(Layer.provide(bridgeLayer));
const worldRuntimeLayer = WorldLive.pipe(
  Layer.provide(Layer.mergeAll(bridgeLayer, waitRuntimeLayer)),
);
const packetRuntimeLayer = PacketLive.pipe(
  Layer.provide(Layer.mergeAll(bridgeLayer, authLayer, worldRuntimeLayer)),
);
const coreRuntimeLayer = Layer.mergeAll(
  waitRuntimeLayer,
  packetRuntimeLayer,
  worldRuntimeLayer,
  authLayer,
);
const gameEventsRuntimeLayer = GameEventsLive;
const gameEventProjectorRuntimeLayer = GameEventProjectorLive.pipe(
  Layer.provide(Layer.mergeAll(coreRuntimeLayer, gameEventsRuntimeLayer)),
);
const runtimeLayer = Layer.mergeAll(
  coreRuntimeLayer,
  gameEventsRuntimeLayer,
  gameEventProjectorRuntimeLayer,
);

const withGameEvents = async <A>(
  body: (
    packetDomain: GameEventsShape,
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
          const packetDomain = yield* GameEvents;
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

const monster = (overrides: Partial<MonsterData> = {}): MonsterData => ({
  iLvl: 100,
  intHP: 1000,
  intHPMax: 1000,
  intMP: 100,
  intMPMax: 100,
  intState: 1,
  monId: 1,
  monMapId: 2,
  sRace: "Undead",
  strFrame: "Enter",
  strMonName: "Training Dummy",
  ...overrides,
});

const emitServerPacket = (raw: string): void => {
  const handler = (window as PacketWindow).packetFromServer;
  if (typeof handler !== "function") {
    throw new GameEventsTestError({
      message: "window.packetFromServer was not registered",
    });
  }

  handler(raw);
};

const emitExtensionPacket = (raw: string): void => {
  const handler = (window as PacketWindow).onExtensionResponse;
  if (typeof handler !== "function") {
    throw new GameEventsTestError({
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
                new GameEventsTestError({
                  message: "timed out waiting for event",
                }),
              ),
            500,
          );
        }),
      ]),
    catch: (cause) =>
      cause instanceof GameEventsTestError
        ? cause
        : new GameEventsTestError({
            cause,
            message: "event wait failed",
          }),
  });

test("packet domain updates remote player position from uotls move packets", async () => {
  const result = await withGameEvents((packetDomain, world) =>
    Effect.gen(function* () {
      yield* world.players.add(avatar("Hero"));
      let resolveLocation:
        | ((event: GameEventMap["playerLocation"]) => void)
        | undefined;
      const observedLocation = new Promise<
        GameEventMap["playerLocation"]
      >((resolve) => {
        resolveLocation = resolve;
      });

      yield* packetDomain.on("playerLocation", (event) =>
        Effect.sync(() => resolveLocation?.(event)),
      );

      emitExtensionPacket(
        JSON.stringify({
          dataObj: [
            "uotls",
            "-1",
            "Hero",
            "tx:464,ty:445,sp:8,strFrame:Enter",
          ],
          type: "str",
        }),
      );
      yield* Effect.sleep("10 millis");

      const player = yield* world.players.getByName("Hero");
      if (Option.isNone(player)) {
        throw new GameEventsTestError({ message: "player was not found" });
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
  const data = await withGameEvents((_packetDomain, world) =>
    Effect.gen(function* () {
      yield* world.players.add(avatar("Hero"));

      emitExtensionPacket(
        JSON.stringify({
          dataObj: [
            "uotls",
            "-1",
            "Hero",
            "strFrame:R2,strPad:Left,px:500,py:375,mvts:-1,mvtd:0,tx:0,ty:0,bResting:false",
          ],
          type: "str",
        }),
      );
      yield* Effect.sleep("10 millis");

      const player = yield* world.players.getByName("Hero");
      if (Option.isNone(player)) {
        throw new GameEventsTestError({ message: "player was not found" });
      }

      return player.value.data;
    }),
  );

  expect(data.strFrame).toBe("R2");
  expect(data.strPad).toBe("Left");
  expect(data.tx).toBe(500);
  expect(data.ty).toBe(375);
});

test("game event projector updates player afk state and emits afk events", async () => {
  const result = await withGameEvents((gameEvents, world) =>
    Effect.gen(function* () {
      yield* world.players.add(avatar("Hero", { afk: false }));
      let resolveAfk:
        | ((event: GameEventMap["afk"]) => void)
        | undefined;
      const observedAfk = new Promise<GameEventMap["afk"]>((resolve) => {
        resolveAfk = resolve;
      });

      yield* gameEvents.on("afk", (event) =>
        Effect.sync(() => resolveAfk?.(event)),
      );

      emitExtensionPacket(
        JSON.stringify({
          dataObj: ["uotls", "-1", "Hero", "afk:true"],
          type: "str",
        }),
      );

      const player = yield* world.players.getByName("Hero");
      if (Option.isNone(player)) {
        throw new GameEventsTestError({ message: "player was not found" });
      }

      return {
        afk: player.value.data.afk,
        event: yield* waitForEvent(observedAfk),
      };
    }),
  );

  expect(result.afk).toBe(true);
  expect(result.event).toMatchObject({
    afk: true,
    username: "Hero",
  });
});

test("game event projector emits monster death from addGoldExp packets", async () => {
  const event = await withGameEvents((gameEvents) =>
    Effect.gen(function* () {
      let resolveDeath:
        | ((event: GameEventMap["monsterDeath"]) => void)
        | undefined;
      const observed = new Promise<GameEventMap["monsterDeath"]>((resolve) => {
        resolveDeath = resolve;
      });

      yield* gameEvents.on("monsterDeath", (death) =>
        Effect.sync(() => resolveDeath?.(death)),
      );

      emitExtensionPacket(
        JSON.stringify({
          dataObj: {
            cmd: "addGoldExp",
            id: 10,
            intExp: 0,
            intGold: 0,
            typ: "m",
          },
          type: "json",
        }),
      );

      return yield* waitForEvent(observed);
    }),
  );

  expect(event.monMapId).toBe(10);
});

test("game event projector emits quest completion from successful ccqr packets", async () => {
  const events = await withGameEvents((gameEvents) =>
    Effect.gen(function* () {
      const observed: GameEventMap["questComplete"][] = [];

      yield* gameEvents.on("questComplete", (quest) =>
        Effect.sync(() => observed.push(quest)),
      );

      emitExtensionPacket(
        JSON.stringify({
          dataObj: {
            cmd: "addGoldExp",
            intExp: 0,
            intGold: 0,
            typ: "q",
          },
          type: "json",
        }),
      );
      emitExtensionPacket(
        JSON.stringify({
          dataObj: {
            QuestID: 11,
            bSuccess: 1,
            cmd: "ccqr",
            rewardObj: {
              iCP: 0,
              intCoins: 0,
              intExp: 100,
              intGold: 100,
              typ: "q",
            },
            sName: "Twilly's New Staff",
          },
          type: "json",
        }),
      );
      yield* Effect.sleep("10 millis");

      return observed;
    }),
  );

  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    QuestID: 11,
    bSuccess: 1,
    rewardObj: {
      iCP: 0,
      intCoins: 0,
      intExp: 100,
      intGold: 100,
      typ: "q",
    },
    sName: "Twilly's New Staff",
  });
  expect(events[0]?.packet.cmd).toBe("ccqr");
});

test("packet domain emits animation message events with monster ids", async () => {
  const event = await withGameEvents((packetDomain) =>
    Effect.gen(function* () {
      let resolveEvent:
        | ((event: GameEventMap["animationMessage"]) => void)
        | undefined;
      const observed = new Promise<GameEventMap["animationMessage"]>(
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
  const event = await withGameEvents((packetDomain) =>
    Effect.gen(function* () {
      let resolveEvent:
        | ((event: GameEventMap["animationMessage"]) => void)
        | undefined;
      const observed = new Promise<GameEventMap["animationMessage"]>(
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
  const event = await withGameEvents((packetDomain) =>
    Effect.gen(function* () {
      let resolveEvent:
        | ((event: GameEventMap["animationMessage"]) => void)
        | undefined;
      const observed = new Promise<GameEventMap["animationMessage"]>(
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
  const events = await withGameEvents((packetDomain, world) =>
    Effect.gen(function* () {
      const observed: Array<GameEventMap["auraAdded" | "auraRemoved"]> =
        [];
      let resolveEvents:
        | ((
            events: Array<GameEventMap["auraAdded" | "auraRemoved"]>,
          ) => void)
        | undefined;
      const done = new Promise<
        Array<GameEventMap["auraAdded" | "auraRemoved"]>
      >((resolve) => {
        resolveEvents = resolve;
      });

      const pushEvent = (
        event: GameEventMap["auraAdded" | "auraRemoved"],
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
      yield* world.monsters.add(
        monster({ monMapId: 2, strMonName: "Training Dummy" }),
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
      targetName: "Training Dummy",
      targetType: "monster",
    },
    {
      auraName: "Focus",
      targetId: 2,
      targetName: "Training Dummy",
      targetType: "monster",
    },
  ]);
});

test("packet domain emits player aura target names", async () => {
  const event = await withGameEvents((packetDomain, world) =>
    Effect.gen(function* () {
      yield* world.players.add(avatar("Hero", { entID: 9 }));

      let resolveEvent: ((event: GameEventMap["auraAdded"]) => void) | undefined;
      const observed = new Promise<GameEventMap["auraAdded"]>((resolve) => {
        resolveEvent = resolve;
      });

      yield* packetDomain.on("auraAdded", (auraEvent) =>
        Effect.sync(() => resolveEvent?.(auraEvent)),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","a":[{"cmd":"aura+","tInf":"p:9","auras":[{"isNew":true,"nam":"Haste"}]}]}}}',
      );

      return yield* waitForEvent(observed);
    }),
  );

  expect(event).toMatchObject({
    auraName: "Haste",
    targetId: 9,
    targetName: "Hero",
    targetType: "player",
  });
});
