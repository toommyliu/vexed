import { Collection } from "@vexed/collection";
import { Avatar, EntityState, Monster } from "@vexed/game";
import type { AvatarData, MonsterData } from "@vexed/game";
import { Effect, Layer, Option } from "effect";
import { expect, test } from "vitest";
import { SwfCallError } from "../Errors";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Combat, type CombatShape } from "../Services/Combat";
import { Drops, type DropsShape } from "../Services/Drops";
import {
  PacketDomain,
  type PacketDomainAntiCounterEvent,
  type PacketDomainEventHandler,
  type PacketDomainShape,
} from "../Services/PacketDomain";
import { Player, type PlayerShape } from "../Services/Player";
import { Settings, type SettingsShape } from "../Services/Settings";
import { World, type WorldShape } from "../Services/World";
import { CombatLive } from "./Combat";

const drops = {
  acceptDrop: () => Effect.void,
  containsDrop: () => Effect.succeed(false),
  getDrops: () => Effect.succeed([]),
  isUsingCustomDrops: () => Effect.succeed(false),
  rejectDrop: () => Effect.succeed(false),
  toggleUi: () => Effect.void,
} satisfies DropsShape;

const player = {
  isAlive: () => Effect.succeed(true),
  jumpToCell: () => Effect.void,
} as unknown as PlayerShape;

const avatarData = (overrides?: Partial<AvatarData>): AvatarData => ({
  afk: false,
  entID: 1,
  entType: "player",
  intHP: 1_000,
  intHPMax: 1_000,
  intLevel: 100,
  intMP: 100,
  intMPMax: 100,
  intState: EntityState.Idle,
  strFrame: "Boss",
  strPad: "Left",
  strUsername: "Tester",
  tx: 0,
  ty: 0,
  uoName: "tester",
  ...overrides,
});

const monsterData = (overrides?: Partial<MonsterData>): MonsterData => ({
  iLvl: 100,
  intHP: 10_000,
  intHPMax: 10_000,
  intMP: 100,
  intMPMax: 100,
  intState: EntityState.Idle,
  monId: 1,
  monMapId: 7,
  sRace: "Undead",
  strFrame: "Boss",
  strMonName: "Training Dummy",
  ...overrides,
});

const makeBridge = (
  cooldowns: readonly number[],
  calls: string[],
): BridgeShape => {
  let cooldownIndex = 0;

  return {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed(null) as Effect.Effect<
          ReturnType<Window["swf"][K]>
        >;
      }

      if (path === "combat.getSkillCooldownRemaining") {
        const cooldown =
          cooldowns[Math.min(cooldownIndex, cooldowns.length - 1)] ?? 0;
        cooldownIndex += 1;
        calls.push(`combat.getSkillCooldownRemaining:${cooldown}`);
        return Effect.succeed(cooldown) as Effect.Effect<
          ReturnType<Window["swf"][K]>
        >;
      }

      if (path === "combat.forceUseSkill") {
        calls.push(`combat.forceUseSkill:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };
};

const withCombat = async <A>(
  bridge: BridgeShape,
  body: (combat: CombatShape) => Effect.Effect<A, unknown>,
  services?: {
    readonly player?: PlayerShape;
    readonly antiCounterEnabled?: boolean;
    readonly packetDomain?: PacketDomainShape;
    readonly world?: WorldShape;
  },
): Promise<A> => {
  const settings = {
    isAntiCounterEnabled: () =>
      Effect.succeed(services?.antiCounterEnabled ?? false),
  } as unknown as SettingsShape;
  const dependencies =
    services?.packetDomain === undefined
      ? Layer.mergeAll(
          Layer.succeed(Bridge)(bridge),
          Layer.succeed(Drops)(drops),
          Layer.succeed(Player)(services?.player ?? player),
          Layer.succeed(Settings)(settings),
        )
      : Layer.mergeAll(
          Layer.succeed(Bridge)(bridge),
          Layer.succeed(Drops)(drops),
          Layer.succeed(Player)(services?.player ?? player),
          Layer.succeed(Settings)(settings),
          Layer.succeed(PacketDomain)(services.packetDomain),
        );
  const combatLayer = CombatLive.pipe(Layer.provide(dependencies));
  const runtimeLayer =
    services?.world === undefined
      ? combatLayer
      : Layer.mergeAll(combatLayer, Layer.succeed(World)(services.world));

  return Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const combat = yield* Combat;
        return yield* body(combat);
      }),
    ).pipe(Effect.provide(runtimeLayer)),
  );
};

const makeKillWorld = (
  avatar: Avatar,
  monster: Monster,
  options?: {
    readonly reviveAfterDeadPoll?: boolean;
  },
): WorldShape => ({
  map: {
    getCellMonsters: () => Effect.succeed([monster]),
    getCells: () => Effect.succeed(["Enter", "Boss"]),
    getCellPads: () => Effect.succeed(["Spawn", "Left"]),
    isLoaded: () => Effect.succeed(true),
    getMapItem: () => Effect.void,
    loadSwf: () => Effect.void,
    reload: () => Effect.void,
    setSpawnPoint: () => Effect.void,
    getName: () => Effect.succeed("testmap"),
    getId: () => Effect.succeed(1),
    getRoomNumber: () => Effect.succeed(1),
    setName: () => Effect.void,
    setId: () => Effect.void,
    setRoomNumber: () => Effect.void,
    reset: () => Effect.void,
  },
  players: {
    register: () => Effect.void,
    unregister: () => Effect.void,
    add: () => Effect.void,
    remove: () => Effect.void,
    setSelf: () => Effect.void,
    getAll: () => Effect.succeed(new Collection([["tester", avatar]])),
    getSelf: () => Effect.succeed(Option.some(avatar)),
    withSelf: (f) =>
      Effect.sync(() => {
        const value = f(avatar);
        if (
          options?.reviveAfterDeadPoll &&
          value === false &&
          avatar.data.intHP <= 0
        ) {
          avatar.data.intHP = avatar.data.intHPMax;
          avatar.data.intState = EntityState.Idle;
        }

        return Option.some(value);
      }),
    get: () => Effect.succeed(Option.some(avatar)),
    getByName: () => Effect.succeed(Option.some(avatar)),
    addAura: () => Effect.void,
    updateAura: () => Effect.void,
    removeAura: () => Effect.void,
    getAuras: () => Effect.succeed([]),
    getAura: () => Effect.succeed(Option.none()),
    clearAuras: () => Effect.void,
  },
  monsters: {
    getAll: () => Effect.succeed(new Collection([[monster.monMapId, monster]])),
    add: () => Effect.void,
    get: (monMapId) =>
      Effect.succeed(
        monMapId === monster.monMapId ? Option.some(monster) : Option.none(),
      ),
    findByName: () => Effect.succeed(Option.some(monster)),
    addAura: () => Effect.void,
    updateAura: () => Effect.void,
    removeAura: () => Effect.void,
    getAura: () => Effect.succeed(Option.none()),
    clearAuras: () => Effect.void,
  },
});

const antiCounterEvent = (
  overrides: Partial<PacketDomainAntiCounterEvent>,
): PacketDomainAntiCounterEvent =>
  ({
    durationMs: 7_000,
    monMapId: 7,
    packet: {},
    source: "message",
    triggerId: "anti-counter",
    triggerText: "prepares a counter attack",
    ...overrides,
  }) as PacketDomainAntiCounterEvent;

test("force useSkill waits through cooldown and confirmation before casting", async () => {
  const calls: string[] = [];

  await withCombat(makeBridge([20, 0, 20, 0, 0], calls), (combat) =>
    combat.useSkill(5, true, true),
  );

  expect(calls).toEqual([
    "combat.getTarget",
    "combat.getSkillCooldownRemaining:20",
    "combat.getSkillCooldownRemaining:0",
    "combat.getSkillCooldownRemaining:20",
    "combat.getSkillCooldownRemaining:0",
    "combat.getSkillCooldownRemaining:0",
    "combat.getTarget",
    "combat.forceUseSkill:5",
  ]);
});

test("target reads treat transient swf call failures as no target", async () => {
  const calls: string[] = [];
  const avatar = new Avatar(avatarData());
  const monster = new Monster(monsterData());
  const world = makeKillWorld(avatar, monster);
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      _args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.getTarget" || path === "combat.hasTarget") {
        calls.push(path);
        return Effect.fail(
          new SwfCallError({
            method: path,
            cause: new Error("An invalid exception was thrown."),
          }),
        ) as Effect.Effect<ReturnType<Window["swf"][K]>, SwfCallError>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    (combat) =>
      Effect.gen(function* () {
        expect(yield* combat.getTarget()).toBeNull();
        expect(yield* combat.hasTarget()).toBe(false);
      }),
    { world },
  );

  expect(calls).toEqual(["combat.getTarget", "combat.hasTarget"]);
});

test("useSkill is a no-op when the player is dead", async () => {
  const calls: string[] = [];
  const bridge = makeBridge([0], calls);

  await withCombat(bridge, (combat) => combat.useSkill(1), {
    player: {
      ...player,
      isAlive: () => Effect.succeed(false),
    } as PlayerShape,
  });

  expect(calls).toEqual([]);
});

test("anti-counter start stops auto attack and clears the target when enabled", async () => {
  const calls: string[] = [];
  let antiCounterStart:
    | PacketDomainEventHandler<"antiCounterStart">
    | undefined;
  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event === "antiCounterStart") {
        antiCounterStart =
          handler as PacketDomainEventHandler<"antiCounterStart">;
      }

      return Effect.succeed(() => undefined);
    },
  } satisfies PacketDomainShape;
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      _args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed({
          MonMapID: 7,
          type: "monster",
        }) as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (
        path === "combat.cancelAutoAttack" ||
        path === "combat.cancelTarget"
      ) {
        calls.push(path);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    () =>
      Effect.gen(function* () {
        expect(antiCounterStart).toBeDefined();
        yield* antiCounterStart!(antiCounterEvent({ monMapId: 7 }));
      }),
    { antiCounterEnabled: true, packetDomain },
  );

  expect(calls).toEqual([
    "combat.getTarget",
    "combat.cancelAutoAttack",
    "combat.cancelTarget",
  ]);
});

test("anti-counter end resumes a target stopped by anti-counter", async () => {
  const calls: string[] = [];
  let antiCounterStart:
    | PacketDomainEventHandler<"antiCounterStart">
    | undefined;
  let antiCounterEnd: PacketDomainEventHandler<"antiCounterEnd"> | undefined;
  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event === "antiCounterStart") {
        antiCounterStart =
          handler as PacketDomainEventHandler<"antiCounterStart">;
      } else if (event === "antiCounterEnd") {
        antiCounterEnd = handler as PacketDomainEventHandler<"antiCounterEnd">;
      }

      return Effect.succeed(() => undefined);
    },
  } satisfies PacketDomainShape;
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed({
          MonMapID: 7,
          type: "monster",
        }) as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (
        path === "combat.cancelAutoAttack" ||
        path === "combat.cancelTarget"
      ) {
        calls.push(path);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (path === "combat.attackMonsterById") {
        calls.push(`combat.attackMonsterById:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    () =>
      Effect.gen(function* () {
        expect(antiCounterStart).toBeDefined();
        expect(antiCounterEnd).toBeDefined();
        yield* antiCounterStart!(antiCounterEvent({ monMapId: 7 }));
        yield* antiCounterEnd!(antiCounterEvent({ monMapId: 7 }));
      }),
    { antiCounterEnabled: true, packetDomain },
  );

  expect(calls).toEqual([
    "combat.getTarget",
    "combat.cancelAutoAttack",
    "combat.cancelTarget",
    "combat.attackMonsterById:7",
  ]);
});

test("anti-counter end does not resume while another anti-counter is active", async () => {
  const calls: string[] = [];
  let targetReadCount = 0;
  let antiCounterStart:
    | PacketDomainEventHandler<"antiCounterStart">
    | undefined;
  let antiCounterEnd: PacketDomainEventHandler<"antiCounterEnd"> | undefined;
  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event === "antiCounterStart") {
        antiCounterStart =
          handler as PacketDomainEventHandler<"antiCounterStart">;
      } else if (event === "antiCounterEnd") {
        antiCounterEnd = handler as PacketDomainEventHandler<"antiCounterEnd">;
      }

      return Effect.succeed(() => undefined);
    },
  } satisfies PacketDomainShape;
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.getTarget") {
        targetReadCount += 1;
        calls.push("combat.getTarget");
        return Effect.succeed(
          targetReadCount === 1 ? { MonMapID: 7, type: "monster" } : null,
        ) as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (
        path === "combat.cancelAutoAttack" ||
        path === "combat.cancelTarget"
      ) {
        calls.push(path);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (path === "combat.attackMonsterById") {
        calls.push(`combat.attackMonsterById:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    () =>
      Effect.gen(function* () {
        expect(antiCounterStart).toBeDefined();
        expect(antiCounterEnd).toBeDefined();
        yield* antiCounterStart!(
          antiCounterEvent({ monMapId: 7, triggerId: "anti-counter-a" }),
        );
        yield* antiCounterStart!(
          antiCounterEvent({ monMapId: 7, triggerId: "anti-counter-b" }),
        );
        yield* antiCounterEnd!(
          antiCounterEvent({ monMapId: 7, triggerId: "anti-counter-a" }),
        );
        yield* antiCounterEnd!(
          antiCounterEvent({ monMapId: 7, triggerId: "anti-counter-b" }),
        );
      }),
    { antiCounterEnabled: true, packetDomain },
  );

  expect(calls).toEqual([
    "combat.getTarget",
    "combat.cancelAutoAttack",
    "combat.cancelTarget",
    "combat.getTarget",
    "combat.attackMonsterById:7",
  ]);
});

test("anti-counter start does not cancel the current target when disabled", async () => {
  const calls: string[] = [];
  let antiCounterStart:
    | PacketDomainEventHandler<"antiCounterStart">
    | undefined;
  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event === "antiCounterStart") {
        antiCounterStart =
          handler as PacketDomainEventHandler<"antiCounterStart">;
      }

      return Effect.succeed(() => undefined);
    },
  } satisfies PacketDomainShape;
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(path: K) {
      calls.push(String(path));
      return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    () =>
      Effect.gen(function* () {
        expect(antiCounterStart).toBeDefined();
        yield* antiCounterStart!(antiCounterEvent({ monMapId: 7 }));
      }),
    { antiCounterEnabled: false, packetDomain },
  );

  expect(calls).toEqual([]);
});

test("useSkill ignores tracked anti-counters when anti-counter is disabled", async () => {
  const calls: string[] = [];
  let antiCounterStart:
    | PacketDomainEventHandler<"antiCounterStart">
    | undefined;
  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event === "antiCounterStart") {
        antiCounterStart =
          handler as PacketDomainEventHandler<"antiCounterStart">;
      }

      return Effect.succeed(() => undefined);
    },
  } satisfies PacketDomainShape;
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed({
          MonMapID: 7,
          type: "monster",
        }) as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (path === "combat.useSkill") {
        calls.push(`combat.useSkill:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    (combat) =>
      Effect.gen(function* () {
        expect(antiCounterStart).toBeDefined();
        yield* antiCounterStart!(antiCounterEvent({ monMapId: 7 }));
        yield* combat.useSkill(1);
      }),
    { antiCounterEnabled: false, packetDomain },
  );

  expect(calls).toEqual([
    "combat.getTarget",
    "combat.getTarget",
    "combat.useSkill:1",
  ]);
});

test("useSkill stops auto attack and does not cast while anti-counter is active", async () => {
  const calls: string[] = [];
  let targetReadCount = 0;
  let antiCounterStart:
    | PacketDomainEventHandler<"antiCounterStart">
    | undefined;
  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event === "antiCounterStart") {
        antiCounterStart =
          handler as PacketDomainEventHandler<"antiCounterStart">;
      }

      return Effect.succeed(() => undefined);
    },
  } satisfies PacketDomainShape;
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(path: K) {
      if (path === "combat.getTarget") {
        targetReadCount += 1;
        calls.push("combat.getTarget");
        return Effect.succeed(
          targetReadCount === 1 ? null : { MonMapID: 7, type: "monster" },
        ) as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (
        path === "combat.cancelAutoAttack" ||
        path === "combat.cancelTarget"
      ) {
        calls.push(path);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    (combat) =>
      Effect.gen(function* () {
        expect(antiCounterStart).toBeDefined();
        yield* antiCounterStart!(antiCounterEvent({ monMapId: 7 }));
        yield* combat.useSkill(1);
      }),
    { antiCounterEnabled: true, packetDomain },
  );

  expect(calls).toEqual([
    "combat.getTarget",
    "combat.getTarget",
    "combat.cancelAutoAttack",
    "combat.cancelTarget",
  ]);
});

test("attackMonster does not hit while anti-counter is active", async () => {
  const calls: string[] = [];
  let antiCounterStart:
    | PacketDomainEventHandler<"antiCounterStart">
    | undefined;
  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event === "antiCounterStart") {
        antiCounterStart =
          handler as PacketDomainEventHandler<"antiCounterStart">;
      }

      return Effect.succeed(() => undefined);
    },
  } satisfies PacketDomainShape;
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      _args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed(null) as Effect.Effect<
          ReturnType<Window["swf"][K]>
        >;
      }

      if (
        path === "combat.cancelAutoAttack" ||
        path === "combat.cancelTarget"
      ) {
        calls.push(path);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    (combat) =>
      Effect.gen(function* () {
        expect(antiCounterStart).toBeDefined();
        yield* antiCounterStart!(antiCounterEvent({ monMapId: 7 }));
        const attacked = yield* combat.attackMonster(7);
        expect(attacked).toBe(false);
      }),
    { antiCounterEnabled: true, packetDomain },
  );

  expect(calls).toEqual([
    "combat.getTarget",
    "combat.cancelAutoAttack",
    "combat.cancelTarget",
  ]);
});

test("attackMonster ignores tracked anti-counters when anti-counter is disabled", async () => {
  const calls: string[] = [];
  let antiCounterStart:
    | PacketDomainEventHandler<"antiCounterStart">
    | undefined;
  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event === "antiCounterStart") {
        antiCounterStart =
          handler as PacketDomainEventHandler<"antiCounterStart">;
      }

      return Effect.succeed(() => undefined);
    },
  } satisfies PacketDomainShape;
  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.attackMonsterById") {
        calls.push(`combat.attackMonsterById:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    (combat) =>
      Effect.gen(function* () {
        expect(antiCounterStart).toBeDefined();
        yield* antiCounterStart!(antiCounterEvent({ monMapId: 7 }));
        const attacked = yield* combat.attackMonster(7);
        expect(attacked).toBe(true);
      }),
    { antiCounterEnabled: false, packetDomain },
  );

  expect(calls).toEqual(["combat.attackMonsterById:7"]);
});

test("kill waits for respawn before attacking", async () => {
  const calls: string[] = [];
  const avatar = new Avatar(
    avatarData({
      intHP: 0,
      intState: EntityState.Dead,
      strFrame: "Boss",
      strPad: "Left",
    }),
  );
  const monster = new Monster(monsterData());
  const world = makeKillWorld(avatar, monster, {
    reviveAfterDeadPoll: true,
  });

  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.attackMonsterById") {
        calls.push(`combat.attackMonsterById:${String(args?.[0])}`);
        monster.data.intHP = 0;
        monster.data.intState = EntityState.Dead;
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed(null) as Effect.Effect<
          ReturnType<Window["swf"][K]>
        >;
      }

      if (path === "combat.useSkill") {
        calls.push(`combat.useSkill:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (
        path === "combat.cancelAutoAttack" ||
        path === "combat.cancelTarget"
      ) {
        calls.push(path);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    (combat) => combat.kill("Training Dummy", { skillDelay: 0 }),
    { world },
  );

  expect(calls[0]).toBe("combat.attackMonsterById:7");
});

test("kill restores the starting combat cell and pad after respawn", async () => {
  const calls: string[] = [];
  const avatar = new Avatar(avatarData());
  const monster = new Monster(monsterData());
  const world = makeKillWorld(avatar, monster, {
    reviveAfterDeadPoll: true,
  });
  let attackCount = 0;

  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.attackMonsterById") {
        attackCount += 1;
        calls.push(`combat.attackMonsterById:${String(args?.[0])}`);

        if (attackCount === 1) {
          avatar.data.intHP = 0;
          avatar.data.intState = EntityState.Dead;
          avatar.data.strFrame = "Enter";
          avatar.data.strPad = "Spawn";
        } else {
          monster.data.intHP = 0;
          monster.data.intState = EntityState.Dead;
        }

        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed(null) as Effect.Effect<
          ReturnType<Window["swf"][K]>
        >;
      }

      if (path === "combat.useSkill") {
        calls.push(`combat.useSkill:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (
        path === "combat.cancelAutoAttack" ||
        path === "combat.cancelTarget"
      ) {
        calls.push(path);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  const restoringPlayer = {
    ...player,
    jumpToCell: (cell: string, pad?: string) =>
      Effect.sync(() => {
        calls.push(`player.jumpToCell:${cell}:${pad ?? ""}`);
        avatar.data.strFrame = cell;
        avatar.data.strPad = pad ?? "";
      }),
  } as PlayerShape;

  await withCombat(
    bridge,
    (combat) => combat.kill("Training Dummy", { skillDelay: 0 }),
    { player: restoringPlayer, world },
  );

  expect(calls).toContain("player.jumpToCell:Boss:Left");
  expect(
    calls.filter((call) => call === "combat.attackMonsterById:7"),
  ).toHaveLength(2);
});

test("kill switches to a respawned priority target before waiting on skill readiness", async () => {
  const calls: string[] = [];
  const avatar = new Avatar(avatarData());
  const boss = new Monster(
    monsterData({
      monMapId: 7,
      strMonName: "Nulgath the Archfiend",
    }),
  );
  const blade = new Monster(
    monsterData({
      intHP: 0,
      intState: EntityState.Dead,
      monMapId: 8,
      strMonName: "Overfiend Blade",
    }),
  );

  const world = makeKillWorld(avatar, boss);
  const twoMonsterWorld = {
    ...world,
    monsters: {
      ...world.monsters,
      getAll: () =>
        Effect.succeed(
          new Collection([
            [boss.monMapId, boss],
            [blade.monMapId, blade],
          ]),
        ),
      get: (monMapId: number) =>
        Effect.succeed(
          monMapId === boss.monMapId
            ? Option.some(boss)
            : monMapId === blade.monMapId
              ? Option.some(blade)
              : Option.none(),
        ),
    },
  } satisfies WorldShape;

  const bridge: BridgeShape = {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.attackMonsterById") {
        const monMapId = Number(args?.[0]);
        calls.push(`combat.attackMonsterById:${monMapId}`);

        if (monMapId === boss.monMapId) {
          blade.data.intHP = blade.data.intHPMax;
          blade.data.intState = EntityState.Idle;
        } else if (monMapId === blade.monMapId) {
          boss.data.intHP = 0;
          boss.data.intState = EntityState.Dead;
        }

        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed(null) as Effect.Effect<
          ReturnType<Window["swf"][K]>
        >;
      }

      if (path === "combat.getSkillCooldownRemaining") {
        calls.push("combat.getSkillCooldownRemaining");
        return Effect.succeed(0) as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (path === "combat.useSkill") {
        calls.push(`combat.useSkill:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      if (
        path === "combat.cancelAutoAttack" ||
        path === "combat.cancelTarget"
      ) {
        calls.push(path);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };

  await withCombat(
    bridge,
    (combat) =>
      combat.kill("Nulgath the Archfiend", {
        killPriority: ["Overfiend Blade"],
        skillDelay: 0,
        skillSet: [1],
        skillWait: true,
      }),
    { world: twoMonsterWorld },
  );

  expect(calls.indexOf("combat.attackMonsterById:7")).toBeLessThan(
    calls.indexOf("combat.attackMonsterById:8"),
  );
  expect(calls.indexOf("combat.useSkill:1")).toBeGreaterThan(
    calls.indexOf("combat.attackMonsterById:8"),
  );
});
