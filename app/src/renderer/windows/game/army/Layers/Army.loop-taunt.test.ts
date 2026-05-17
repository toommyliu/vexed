import { Collection } from "@vexed/collection";
import { EntityState, Monster } from "@vexed/game";
import { Effect, Layer, Option } from "effect";
import { expect, test } from "vitest";
import type { ArmySession } from "../Services/Army";
import { Army } from "../Services/Army";
import { Auth, type AuthShape } from "../../flash/Services/Auth";
import { Combat, type CombatShape } from "../../flash/Services/Combat";
import { Inventory, type InventoryShape } from "../../flash/Services/Inventory";
import {
  PacketDomain,
  type PacketDomainEvent,
  type PacketDomainEventHandler,
  type PacketDomainEventMap,
  type PacketDomainShape,
} from "../../flash/Services/PacketDomain";
import { Player, type PlayerShape } from "../../flash/Services/Player";
import { World, type WorldShape } from "../../flash/Services/World";
import { JobGate, type JobGateShape } from "../../jobs/Services/JobGate";
import { JobsLive } from "../../jobs/Layers/Jobs";
import { ArmyLive } from "./Army";

type HandlerStore = {
  [K in PacketDomainEvent]: Set<PacketDomainEventHandler<K>>;
};

const createStore = (): HandlerStore => ({
  animationMessage: new Set(),
  auraAdded: new Set(),
  auraRemoved: new Set(),
  counterAttackEnd: new Set(),
  counterAttackStart: new Set(),
  joinMap: new Set(),
  monsterDeath: new Set(),
  zone: new Set(),
});

const makeSession = (playerNumber: number): ArmySession => ({
  configName: "config",
  leader: "Main",
  playerName: playerNumber === 1 ? "Main" : "Alt",
  playerNumber,
  players: ["Main", "Alt"],
  raw: {},
  role: playerNumber === 1 ? "leader" : "member",
  roomNumber: "1",
  sessionId: "session",
});

const monster = new Monster({
  iLvl: 1,
  intHP: 100,
  intHPMax: 100,
  intMP: 100,
  intMPMax: 100,
  intState: EntityState.Idle,
  monId: 1,
  monMapId: 7,
  sRace: "None",
  strFrame: "Boss",
  strMonName: "Ultra Boss",
});

const makeWorld = (hasAura = false): WorldShape => ({
  map: {
    getCellMonsters: () => Effect.succeed([monster]),
    getCells: () => Effect.succeed(["Enter", "Boss"]),
    getCellPads: () => Effect.succeed(["Spawn"]),
    getId: () => Effect.succeed(1),
    getMapItem: () => Effect.void,
    getName: () => Effect.succeed("test"),
    getRoomNumber: () => Effect.succeed(1),
    isActionAvailable: () => Effect.succeed(true),
    isLoaded: () => Effect.succeed(true),
    loadSwf: () => Effect.void,
    reload: () => Effect.void,
    reset: () => Effect.void,
    setId: () => Effect.void,
    setName: () => Effect.void,
    setRoomNumber: () => Effect.void,
    setSpawnPoint: () => Effect.void,
    waitForGameAction: () => Effect.succeed(true),
  },
  players: {
    add: () => Effect.void,
    addAura: () => Effect.void,
    clearAuras: () => Effect.void,
    get: () => Effect.succeed(Option.none()),
    getAll: () => Effect.succeed(new Collection()),
    getAura: () => Effect.succeed(Option.none()),
    getAuras: () => Effect.succeed([]),
    getByName: () => Effect.succeed(Option.none()),
    getSelf: () => Effect.succeed(Option.none()),
    register: () => Effect.void,
    remove: () => Effect.void,
    removeAura: () => Effect.void,
    setSelf: () => Effect.void,
    unregister: () => Effect.void,
    updateAura: () => Effect.void,
    withSelf: () => Effect.succeed(Option.none()),
  },
  monsters: {
    add: () => Effect.void,
    addAura: () => Effect.void,
    clearAuras: () => Effect.void,
    findByName: (name) =>
      Effect.succeed(
        name === "Ultra Boss" ? Option.some(monster) : Option.none(),
      ),
    get: (monMapId) =>
      Effect.succeed(monMapId === 7 ? Option.some(monster) : Option.none()),
    getAll: () => Effect.succeed(new Collection([[7, monster]])),
    getAura: () =>
      Effect.succeed(
        hasAura ? Option.some({ duration: 1, name: "Focus" }) : Option.none(),
      ),
    removeAura: () => Effect.void,
    updateAura: () => Effect.void,
  },
});

const inventory = {
  contains: () => Effect.succeed(false),
  equip: () => Effect.succeed(true),
  getAvailableSlots: () => Effect.succeed(1),
  getItem: () => Effect.succeed(null),
  getItems: () => Effect.succeed([]),
  getSlots: () => Effect.succeed(1),
  getUsedSlots: () => Effect.succeed(0),
} satisfies InventoryShape;

const jobGate = {
  isOpen: () => Effect.succeed(true),
} satisfies JobGateShape;

const withArmy = async <A>(
  session: ArmySession,
  body: (
    army: import("../Services/Army").ArmyShape,
    emit: <E extends PacketDomainEvent>(
      event: E,
      payload: PacketDomainEventMap[E],
    ) => Effect.Effect<void>,
    calls: string[],
  ) => Effect.Effect<A, unknown>,
  options?: {
    readonly hasAura?: boolean;
  },
): Promise<A> => {
  const store = createStore();
  const calls: string[] = [];
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      ipc: {
        army: {
          barrier: async () => undefined,
          leave: async () => undefined,
          loadConfig: async () => session,
          start: async () => session,
          status: async () => ({ active: true }),
        },
      },
    },
  });

  const auth = {
    connectTo: () =>
      Effect.succeed({
        message: "connected",
        retryable: false,
        status: "connected",
      } as const),
    getLoginSession: () =>
      Effect.succeed({
        bSuccess: 1,
        iUpg: 0,
        servers: [],
        sToken: "password",
        unm: session.playerName,
      }),
    getPassword: () => Effect.succeed("password"),
    getServers: () => Effect.succeed([]),
    getUsername: () => Effect.succeed(session.playerName),
    isLoggedIn: () => Effect.succeed(true),
    isTemporarilyKicked: () => Effect.succeed(false),
    login: () => Effect.void,
    logout: () => Effect.void,
  } satisfies AuthShape;

  const combat = {
    attackMonster: (target) =>
      Effect.sync(() => {
        calls.push(`attack:${String(target)}`);
      }),
    cancelAutoAttack: () => Effect.void,
    cancelTarget: () => Effect.void,
    canUseSkill: () => Effect.succeed(true),
    exit: () => Effect.succeed(true),
    getConsumableSkillItem: () => Effect.succeed(null),
    getTarget: () => Effect.succeed(null),
    hasTarget: () => Effect.succeed(false),
    hunt: () => Effect.succeed(""),
    kill: () => Effect.void,
    killForItem: () => Effect.void,
    killForTempItem: () => Effect.void,
    useSkill: (skill) =>
      Effect.sync(() => {
        calls.push(`skill:${String(skill)}`);
      }),
  } satisfies CombatShape;

  const packetDomain = {
    started: true,
    on: (event, handler) =>
      Effect.sync(() => {
        const handlers = store[event] as Set<typeof handler>;
        handlers.add(handler);
        return () => {
          handlers.delete(handler);
        };
      }),
  } satisfies PacketDomainShape;

  const player = {
    getCell: () => Effect.succeed("Boss"),
    getClassName: () => Effect.succeed("CHAOS AVENGER"),
    getFactions: () => Effect.succeed(new Collection()),
    getGender: () => Effect.succeed("M"),
    getGold: () => Effect.succeed(0),
    getHp: () => Effect.succeed(1),
    getLevel: () => Effect.succeed(1),
    getMaxHp: () => Effect.succeed(1),
    getMaxMp: () => Effect.succeed(1),
    getMp: () => Effect.succeed(1),
    getPad: () => Effect.succeed("Spawn"),
    getPosition: () => Effect.succeed([0, 0] as [number, number]),
    getState: () => Effect.succeed(EntityState.Idle),
    goToPlayer: () => Effect.void,
    hasActiveBoost: () => Effect.succeed(false),
    isAfk: () => Effect.succeed(false),
    isAlive: () => Effect.succeed(true),
    isMember: () => Effect.succeed(false),
    isReady: () => Effect.succeed(true),
    joinMap: () => Effect.void,
    jumpToCell: () => Effect.void,
    reloadAvatar: () => Effect.succeed(true),
    rest: () => Effect.void,
    useBoost: () => Effect.succeed(true),
    walkTo: () => Effect.succeed(true),
  } satisfies PlayerShape;

  const emit = <E extends PacketDomainEvent>(
    event: E,
    payload: PacketDomainEventMap[E],
  ) =>
    Effect.forEach(
      Array.from(store[event]) as readonly PacketDomainEventHandler<E>[],
      (handler) => handler(payload),
      { discard: true },
    );

  const runtimeLayer = ArmyLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        JobsLive.pipe(Layer.provide(Layer.succeed(JobGate)(jobGate))),
        Layer.succeed(Auth)(auth),
        Layer.succeed(Combat)(combat),
        Layer.succeed(Inventory)(inventory),
        Layer.succeed(PacketDomain)(packetDomain),
        Layer.succeed(Player)(player),
        Layer.succeed(World)(makeWorld(options?.hasAura ?? false)),
      ),
    ),
  );

  try {
    return await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const army = yield* Army;
          return yield* body(army, emit, calls);
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

test("Loop Taunt autonomously taunts first in aura mode when aura is absent", async () => {
  const calls = await withArmy(makeSession(1), (army, _emit, calls) =>
    Effect.gen(function* () {
      yield* army.start("config");
      const handle = yield* army.startLoopTaunt({
        aura: "Focus",
        skill: 5,
        target: "Ultra Boss",
      });

      yield* Effect.sleep("100 millis");
      yield* handle.stop();
      return calls;
    }),
  );

  expect(calls).toEqual(["attack:7", "attack:7", "skill:5"]);
});

test("Loop Taunt advances message turns and only casts on local player turn", async () => {
  const calls = await withArmy(makeSession(2), (army, emit, calls) =>
    Effect.gen(function* () {
      yield* army.start("config");
      const handle = yield* army.startLoopTaunt({
        message: "defense shattering",
        players: [1, 2],
        skill: 5,
        target: "id:7",
      });

      yield* Effect.sleep("25 millis");
      yield* emit("animationMessage", {
        message: "defense shattering",
        monMapId: 7,
        packet: { cmd: "ct", data: {}, raw: "", type: "server" },
      });
      yield* Effect.sleep("25 millis");
      yield* emit("animationMessage", {
        message: "defense shattering",
        monMapId: 7,
        packet: { cmd: "ct", data: {}, raw: "", type: "server" },
      });
      yield* Effect.sleep("25 millis");

      yield* handle.stop();
      return calls;
    }),
  );

  expect(calls).toEqual(["attack:7", "attack:7", "skill:5"]);
});
