import { Collection } from "@vexed/collection";
import { Avatar, EntityState, Monster } from "@vexed/game";
import type { AvatarData, MonsterData } from "@vexed/game";
import { Effect, Layer, Option } from "effect";
import { expect, test } from "vitest";
import { SwfCallError } from "../Errors";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Combat, type CombatShape } from "../Services/Combat";
import { Drops, type DropsShape } from "../Services/Drops";
import { Player, type PlayerShape } from "../Services/Player";
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
    readonly world?: WorldShape;
  },
): Promise<A> => {
  const dependencies =
    services?.world === undefined
      ? Layer.mergeAll(
          Layer.succeed(Bridge)(bridge),
          Layer.succeed(Drops)(drops),
          Layer.succeed(Player)(services?.player ?? player),
        )
      : Layer.mergeAll(
          Layer.succeed(Bridge)(bridge),
          Layer.succeed(Drops)(drops),
          Layer.succeed(Player)(services?.player ?? player),
          Layer.succeed(World)(services.world),
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
    isActionAvailable: () => Effect.succeed(true),
    getMapItem: () => Effect.void,
    loadSwf: () => Effect.void,
    reload: () => Effect.void,
    setSpawnPoint: () => Effect.void,
    waitForGameAction: () => Effect.succeed(true),
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
