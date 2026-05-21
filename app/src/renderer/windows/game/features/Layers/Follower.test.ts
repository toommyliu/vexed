import { Avatar } from "@vexed/game";
import { Effect, Fiber, Layer, Option } from "effect";
import { expect, test } from "vitest";
import {
  COMBAT_PROFILE_LIBRARY_VERSION,
  DEFAULT_COMBAT_PROFILE_ID,
  type CombatProfileLibrary,
} from "../../../../../shared/combat-profiles";
import { Combat, type CombatShape } from "../../flash/Services/Combat";
import { Packet, type PacketShape } from "../../flash/Services/Packet";
import {
  PacketDomain,
  type PacketDomainEventMap,
  type PacketDomainShape,
} from "../../flash/Services/PacketDomain";
import { Player, type PlayerShape } from "../../flash/Services/Player";
import { World, type WorldShape } from "../../flash/Services/World";
import { Jobs, type JobsShape } from "../../jobs/Services/Jobs";
import { Follower, type FollowerShape } from "../Services/Follower";
import { FollowerLive } from "./Follower";

const library: CombatProfileLibrary = {
  version: COMBAT_PROFILE_LIBRARY_VERSION,
  profiles: [
    {
      id: DEFAULT_COMBAT_PROFILE_ID,
      label: "Generic",
      role: "Base",
      delayMs: 150,
      cooldownMode: "use-if-ready",
      timeoutMs: 10_000,
      steps: [{ id: "generic-1", skill: 1, conditions: [] }],
    },
    {
      id: "void-highlord",
      label: "Void Highlord",
      role: "DPS",
      delayMs: 150,
      cooldownMode: "use-if-ready",
      timeoutMs: 10_000,
      steps: [{ id: "vhl-1", skill: 1, conditions: [] }],
    },
  ],
  autoAttack: {
    mode: "equipped-class",
  },
};

const withFollower = async <A>(
  body: (
    follower: FollowerShape,
    harness: {
      readonly jobsState: { task?: Effect.Effect<void, unknown> };
      readonly startedJobs: string[];
    },
  ) => Effect.Effect<A, unknown>,
  services?: {
    readonly combat?: CombatShape;
    readonly packet?: PacketShape;
    readonly packetDomain?: PacketDomainShape;
    readonly player?: PlayerShape;
    readonly world?: WorldShape;
  },
): Promise<A> => {
  const startedJobs: string[] = [];
  const jobsState: { task?: Effect.Effect<void, unknown> } = {};
  const jobs = {
    start(key: string, task: Effect.Effect<void, unknown>) {
      startedJobs.push(key);
      jobsState.task = task;
      return Effect.succeed(true);
    },
    startPeriodic: (key: string) => {
      startedJobs.push(key);
      return Effect.succeed(true);
    },
    startPeriodicJob: (definition: { readonly key: string }) => {
      startedJobs.push(definition.key);
      return Effect.succeed(true);
    },
    stop: () => Effect.succeed(true),
    stopAll: () => Effect.void,
    isRunning: () => Effect.succeed(false),
    getRunningKeys: () => Effect.succeed(startedJobs),
  } as JobsShape;

  const combat =
    services?.combat ??
    ({
      attackMonster: () => Effect.succeed(true),
      cancelAutoAttack: () => Effect.void,
      cancelTarget: () => Effect.void,
      exit: () => Effect.void,
      getTarget: () => Effect.succeed(null),
    } as unknown as CombatShape);
  const packet =
    services?.packet ??
    ({
      str: () => Effect.succeed(() => {}),
    } as unknown as PacketShape);
  const player = services?.player ?? ({} as unknown as PlayerShape);
  const packetDomain = services?.packetDomain;
  const world = services?.world ?? ({} as unknown as WorldShape);

  return await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const follower = yield* Follower;
        return yield* body(follower, { jobsState, startedJobs });
      }),
    ).pipe(
      Effect.provide(
        FollowerLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Jobs)(jobs),
              Layer.succeed(Combat)(combat),
              Layer.succeed(Packet)(packet),
              ...(packetDomain === undefined
                ? []
                : [Layer.succeed(PacketDomain)(packetDomain)]),
              Layer.succeed(Player)(player),
              Layer.succeed(World)(world),
            ),
          ),
        ),
      ),
    ),
  );
};

const avatar = (
  username: string,
  cell: string,
  pad: string,
  position: readonly [number, number] = [100, 100],
): Avatar =>
  new Avatar({
    afk: false,
    entID: username === "self" ? 1 : 2,
    entType: "player",
    intHP: 100,
    intHPMax: 100,
    intLevel: 100,
    intMP: 100,
    intMPMax: 100,
    intState: 1,
    strFrame: cell,
    strPad: pad,
    strUsername: username,
    tx: position[0],
    ty: position[1],
    uoName: username.toLowerCase(),
  });

const makeWorld = (self: Avatar, target: Avatar): WorldShape =>
  ({
    map: {
      getCellMonsters: () => Effect.succeed([]),
    },
    monsters: {
      get: () => Effect.succeed(Option.none()),
      findByName: () => Effect.succeed(Option.none()),
    },
    players: {
      getSelf: () => Effect.succeed(Option.some(self)),
      withSelf: <A>(f: (self: Avatar) => A) =>
        Effect.succeed(Option.some(f(self))),
      getByName: (name: string) =>
        Effect.succeed(
          name.toLowerCase() === target.username.toLowerCase()
            ? Option.some(target)
            : Option.none(),
        ),
    },
  }) as unknown as WorldShape;

test("first follower cycle jumps to a known target in another cell", async () => {
  const self = avatar("self", "Enter", "Spawn");
  const target = avatar("hero", "Boss", "Left");
  const goToCalls: string[] = [];
  const jumpCalls: string[] = [];
  const player = {
    goToPlayer: (name: string) =>
      Effect.sync(() => {
        goToCalls.push(name);
        self.data.strFrame = target.cell;
        self.data.strPad = target.pad;
      }),
    isReady: () => Effect.succeed(true),
    jumpToCell: (cell: string, pad?: string) =>
      Effect.sync(() => {
        jumpCalls.push(`${cell}:${pad ?? ""}`);
        self.data.strFrame = cell;
        self.data.strPad = pad ?? "";
      }),
    walkTo: () => Effect.succeed(true),
  } as unknown as PlayerShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("10 millis");
        yield* Fiber.interrupt(fiber);

        return { goToCalls, jumpCalls };
      }),
    {
      player,
      world: makeWorld(self, target),
    },
  );

  expect(result.goToCalls).toEqual([]);
  expect(result.jumpCalls).toEqual(["Boss:Left"]);
});

test("copy walk does nothing while target position is unchanged", async () => {
  const self = avatar("self", "Enter", "Spawn", [100, 100]);
  const target = avatar("hero", "Enter", "Spawn", [100, 100]);
  const walkCalls: [number, number][] = [];
  const player = {
    goToPlayer: () => Effect.void,
    isReady: () => Effect.succeed(true),
    jumpToCell: () => Effect.void,
    walkTo: (x: number, y: number) =>
      Effect.sync(() => {
        walkCalls.push([x, y]);
        return true;
      }),
  } as unknown as PlayerShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
            copyWalk: true,
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("650 millis");
        yield* Fiber.interrupt(fiber);

        return walkCalls;
      }),
    {
      player,
      world: makeWorld(self, target),
    },
  );

  expect(result).toEqual([]);
});

test("copy walk forwards target coordinates after target movement", async () => {
  const self = avatar("self", "Enter", "Spawn", [100, 100]);
  const target = avatar("hero", "Enter", "Spawn", [100, 100]);
  const walkCalls: [number, number][] = [];
  const player = {
    goToPlayer: () => Effect.void,
    isReady: () => Effect.succeed(true),
    jumpToCell: () => Effect.void,
    walkTo: (x: number, y: number) =>
      Effect.sync(() => {
        walkCalls.push([x, y]);
        return true;
      }),
  } as unknown as PlayerShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
            copyWalk: true,
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("50 millis");
        target.data.tx = 140;
        target.data.ty = 160;
        yield* Effect.sleep("650 millis");
        yield* Fiber.interrupt(fiber);

        return walkCalls;
      }),
    {
      player,
      world: makeWorld(self, target),
    },
  );

  expect(result).toEqual([[140, 160]]);
});

test("locked-zone detection suppresses repeated goto attempts", async () => {
  const self = avatar("self", "Enter", "Spawn");
  const goToCalls: string[] = [];
  const strHandlers = new Map<
    string,
    (packet: { readonly data: unknown }) => Effect.Effect<void>
  >();
  const packet = {
    str: (
      cmd: string,
      handler: (packet: { readonly data: unknown }) => Effect.Effect<void>,
    ) =>
      Effect.sync(() => {
        strHandlers.set(cmd, handler);
        return () => strHandlers.delete(cmd);
      }),
  } as unknown as PacketShape;
  const player = {
    goToPlayer: (name: string) =>
      Effect.gen(function* () {
        goToCalls.push(name);
        const warningHandler = strHandlers.get("warning");
        if (warningHandler !== undefined) {
          yield* warningHandler({
            data: ["warning", "-1", "Cannot goto player in locked zone"],
          });
        }
      }),
    isReady: () => Effect.succeed(true),
    jumpToCell: () => Effect.void,
    walkTo: () => Effect.succeed(true),
  } as unknown as PlayerShape;
  const world = {
    map: {
      getCellMonsters: () => Effect.succeed([]),
    },
    monsters: {
      get: () => Effect.succeed(Option.none()),
      findByName: () => Effect.succeed(Option.none()),
    },
    players: {
      getSelf: () => Effect.succeed(Option.some(self)),
      withSelf: <A>(f: (self: Avatar) => A) =>
        Effect.succeed(Option.some(f(self))),
      getByName: () => Effect.succeed(Option.none()),
    },
  } as unknown as WorldShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("650 millis");
        yield* Fiber.interrupt(fiber);

        return goToCalls;
      }),
    {
      packet,
      player,
      world,
    },
  );

  expect(result).toEqual(["hero"]);
});

test("ignored goto requests suppress repeated goto attempts", async () => {
  const self = avatar("self", "Enter", "Spawn");
  const goToCalls: string[] = [];
  const strHandlers = new Map<
    string,
    (packet: { readonly data: unknown }) => Effect.Effect<void>
  >();
  const packet = {
    str: (
      cmd: string,
      handler: (packet: { readonly data: unknown }) => Effect.Effect<void>,
    ) =>
      Effect.sync(() => {
        strHandlers.set(cmd, handler);
        return () => strHandlers.delete(cmd);
      }),
  } as unknown as PacketShape;
  const player = {
    goToPlayer: (name: string) =>
      Effect.gen(function* () {
        goToCalls.push(name);
        const serverHandler = strHandlers.get("server");
        if (serverHandler !== undefined) {
          yield* serverHandler({
            data: ["server", "-1", "hero is ignoring goto requests."],
          });
        }
      }),
    isReady: () => Effect.succeed(true),
    jumpToCell: () => Effect.void,
    walkTo: () => Effect.succeed(true),
  } as unknown as PlayerShape;
  const world = {
    map: {
      getCellMonsters: () => Effect.succeed([]),
    },
    monsters: {
      get: () => Effect.succeed(Option.none()),
      findByName: () => Effect.succeed(Option.none()),
    },
    players: {
      getSelf: () => Effect.succeed(Option.some(self)),
      withSelf: <A>(f: (self: Avatar) => A) =>
        Effect.succeed(Option.some(f(self))),
      getByName: () => Effect.succeed(Option.none()),
    },
  } as unknown as WorldShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("650 millis");
        yield* Fiber.interrupt(fiber);

        return goToCalls;
      }),
    {
      packet,
      player,
      world,
    },
  );

  expect(result).toEqual(["hero"]);
});

test("locked-zone fallbacks are ignored when retries are disabled", async () => {
  const self = avatar("self", "Enter", "Spawn");
  const joinMapCalls: string[] = [];
  const player = {
    goToPlayer: () => Effect.void,
    isReady: () => Effect.succeed(true),
    joinMap: (map: string, cell?: string, pad?: string) =>
      Effect.sync(() => {
        joinMapCalls.push(`${map}:${cell ?? ""}:${pad ?? ""}`);
      }),
    jumpToCell: () => Effect.void,
    walkTo: () => Effect.succeed(true),
  } as unknown as PlayerShape;
  const world = {
    map: {
      getCellMonsters: () => Effect.succeed([]),
    },
    monsters: {
      get: () => Effect.succeed(Option.none()),
      findByName: () => Effect.succeed(Option.none()),
    },
    players: {
      getSelf: () => Effect.succeed(Option.some(self)),
      withSelf: <A>(f: (self: Avatar) => A) =>
        Effect.succeed(Option.some(f(self))),
      getByName: () => Effect.succeed(Option.none()),
    },
  } as unknown as WorldShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
            retryEnabled: false,
            lockedZoneFallbacks: "ultradage-12345,Enter,Spawn",
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("200 millis");
        yield* Fiber.interrupt(fiber);

        return joinMapCalls;
      }),
    {
      player,
      world,
    },
  );

  expect(result).toEqual([]);
});

test("locked-zone room override is applied unless the fallback map has a room", async () => {
  const self = avatar("self", "Enter", "Spawn");
  const joinMapCalls: string[] = [];
  let targetVisible = false;
  const target = avatar("hero", "Boss", "Left");
  const strHandlers = new Map<
    string,
    (packet: { readonly data: unknown }) => Effect.Effect<void>
  >();
  const packet = {
    str: (
      cmd: string,
      handler: (packet: { readonly data: unknown }) => Effect.Effect<void>,
    ) =>
      Effect.sync(() => {
        strHandlers.set(cmd, handler);
        return () => strHandlers.delete(cmd);
      }),
  } as unknown as PacketShape;
  const player = {
    goToPlayer: () =>
      Effect.gen(function* () {
        const warningHandler = strHandlers.get("warning");
        if (warningHandler !== undefined) {
          yield* warningHandler({
            data: ["warning", "-1", "Cannot goto player in locked zone"],
          });
        }
      }),
    isReady: () => Effect.succeed(true),
    joinMap: (map: string, cell?: string, pad?: string) =>
      Effect.sync(() => {
        joinMapCalls.push(`${map}:${cell ?? ""}:${pad ?? ""}`);
        targetVisible = true;
        self.data.strFrame = target.cell;
        self.data.strPad = target.pad;
      }),
    jumpToCell: () => Effect.void,
    walkTo: () => Effect.succeed(true),
  } as unknown as PlayerShape;
  const world = {
    map: {
      getCellMonsters: () => Effect.succeed([]),
    },
    monsters: {
      get: () => Effect.succeed(Option.none()),
      findByName: () => Effect.succeed(Option.none()),
    },
    players: {
      getSelf: () => Effect.succeed(Option.some(self)),
      withSelf: <A>(f: (self: Avatar) => A) =>
        Effect.succeed(Option.some(f(self))),
      getByName: () =>
        Effect.succeed(targetVisible ? Option.some(target) : Option.none()),
    },
  } as unknown as WorldShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
            lockedZoneFallbacks: "ultradage\nultranulgath-98765,Boss,Left",
            lockedZoneRoomOverride: "12345",
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("200 millis");
        yield* Fiber.interrupt(fiber);

        return joinMapCalls;
      }),
    {
      packet,
      player,
      world,
    },
  );

  expect(result).toEqual(["ultradage-12345::"]);
});

test("room-full warnings consume a retry attempt after locked-zone fallback fails", async () => {
  const self = avatar("self", "Enter", "Spawn");
  const strHandlers = new Map<
    string,
    (packet: { readonly data: unknown }) => Effect.Effect<void>
  >();
  const packet = {
    str: (
      cmd: string,
      handler: (packet: { readonly data: unknown }) => Effect.Effect<void>,
    ) =>
      Effect.sync(() => {
        strHandlers.set(cmd, handler);
        return () => strHandlers.delete(cmd);
      }),
  } as unknown as PacketShape;
  const player = {
    goToPlayer: () =>
      Effect.gen(function* () {
        const warningHandler = strHandlers.get("warning");
        if (warningHandler !== undefined) {
          yield* warningHandler({
            data: ["warning", "-1", "Cannot goto player in locked zone"],
          });
        }
      }),
    isReady: () => Effect.succeed(true),
    joinMap: () =>
      Effect.gen(function* () {
        const warningHandler = strHandlers.get("warning");
        if (warningHandler !== undefined) {
          yield* warningHandler({
            data: [
              "warning",
              "-1",
              "Room join failed, destination room is full.",
            ],
          });
        }
      }),
    jumpToCell: () => Effect.void,
    walkTo: () => Effect.succeed(true),
  } as unknown as PlayerShape;
  const world = {
    map: {
      getCellMonsters: () => Effect.succeed([]),
    },
    monsters: {
      get: () => Effect.succeed(Option.none()),
      findByName: () => Effect.succeed(Option.none()),
    },
    players: {
      getSelf: () => Effect.succeed(Option.some(self)),
      withSelf: <A>(f: (self: Avatar) => A) =>
        Effect.succeed(Option.some(f(self))),
      getByName: () => Effect.succeed(Option.none()),
    },
  } as unknown as WorldShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
            lockedZoneFallbacks: "ultradage-12345,Enter,Spawn",
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("200 millis");
        const state = yield* follower.getState();
        yield* Fiber.interrupt(fiber);
        return state;
      }),
    {
      packet,
      player,
      world,
    },
  );

  expect(result.attemptsRemaining).toBe(2);
  expect(result.lastError).toBe("Destination room is full or unreachable");
});

test("animation message triggers cast profile skill while follower combat is enabled", async () => {
  let animationHandler:
    | ((event: PacketDomainEventMap["animationMessage"]) => Effect.Effect<void>)
    | undefined;
  const useSkillCalls: string[] = [];
  const combat = {
    attackMonster: () => Effect.succeed(true),
    cancelAutoAttack: () => Effect.void,
    cancelTarget: () => Effect.void,
    exit: () => Effect.void,
    getTarget: () => Effect.succeed(null),
    useSkill: (skill: number | string, force?: boolean, wait?: boolean) =>
      Effect.sync(() => {
        useSkillCalls.push(`${String(skill)}:${String(force)}:${String(wait)}`);
      }),
  } as unknown as CombatShape;
  const packetDomain = {
    started: true,
    on: (event: string, handler: unknown) =>
      Effect.sync(() => {
        if (event === "animationMessage") {
          animationHandler = handler as (
            event: PacketDomainEventMap["animationMessage"],
          ) => Effect.Effect<void>;
        }
        return () => {};
      }),
  } as PacketDomainShape;

  const result = await withFollower(
    (follower) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: "void-highlord",
          },
          library: {
            ...library,
            profiles: library.profiles.map((profile) =>
              profile.id === "void-highlord"
                ? {
                    ...profile,
                    animationTriggers: [
                      {
                        id: "nuke",
                        messageIncludes: "divine will burn",
                        skill: 5,
                        cooldownMs: 1_000,
                      },
                    ],
                  }
                : profile,
            ),
          },
        });

        if (animationHandler === undefined) {
          throw new Error("Expected animation handler");
        }

        yield* animationHandler({
          message: "The Divine   will burn for all eternity!",
          packet: {} as PacketDomainEventMap["animationMessage"]["packet"],
        });

        return useSkillCalls;
      }),
    {
      combat,
      packetDomain,
    },
  );

  expect(result).toEqual(["5:true:true"]);
});

test("player not ready is ignored without consuming attempts", async () => {
  const player = {
    goToPlayer: () => Effect.void,
    isReady: () => Effect.succeed(false),
    jumpToCell: () => Effect.void,
    walkTo: () => Effect.succeed(true),
  } as unknown as PlayerShape;
  const world = {
    map: {
      getCellMonsters: () => Effect.succeed([]),
    },
    monsters: {
      get: () => Effect.succeed(Option.none()),
      findByName: () => Effect.succeed(Option.none()),
    },
    players: {
      getSelf: () => Effect.succeed(Option.none()),
      withSelf: () => Effect.succeed(Option.none()),
      getByName: () => Effect.succeed(Option.none()),
    },
  } as unknown as WorldShape;

  const result = await withFollower(
    (follower, harness) =>
      Effect.gen(function* () {
        yield* follower.start({
          config: {
            targetName: "hero",
            selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
          },
          library,
        });

        const task = harness.jobsState.task;
        if (!task) {
          throw new Error("Expected follower job task");
        }

        const fiber = yield* Effect.forkDetach(task, {
          startImmediately: true,
        });
        yield* Effect.sleep("50 millis");
        yield* Fiber.interrupt(fiber);

        return yield* follower.getState();
      }),
    {
      player,
      world,
    },
  );

  expect(result).toMatchObject({
    attemptsRemaining: 3,
  });
  expect(result.lastError).toBeUndefined();
  expect(result.stoppedReason).toBeUndefined();
});

test("start without a target reports stopped error and does not start a job", async () => {
  const result = await withFollower((follower, harness) =>
    Effect.gen(function* () {
      const state = yield* follower.start({
        config: {
          targetName: "",
          selectedProfileId: "void-highlord",
        },
        library,
      });
      return { state, startedJobs: harness.startedJobs };
    }),
  );

  expect(result).toEqual({
    state: {
      enabled: false,
      running: false,
      targetName: "",
      phase: "stopped",
      attemptsRemaining: 3,
      lastError: "Target name is required",
      stoppedReason: "Target not found",
    },
    startedJobs: [],
  });
});

test("start resolves selected profile and starts follower job", async () => {
  const result = await withFollower((follower, harness) =>
    Effect.gen(function* () {
      const state = yield* follower.start({
        config: {
          targetName: "hero",
          selectedProfileId: "void-highlord",
          copyWalk: true,
        },
        library,
      });
      return { state, startedJobs: harness.startedJobs };
    }),
  );

  expect(result.state).toMatchObject({
    enabled: true,
    running: true,
    targetName: "hero",
    profileId: "void-highlord",
    profileLabel: "Void Highlord",
    phase: "starting",
    attemptsRemaining: 3,
  });
  expect(result.startedJobs).toEqual(["features:follower"]);
});

test("start uses configured retry attempts", async () => {
  const result = await withFollower((follower) =>
    follower.start({
      config: {
        targetName: "hero",
        selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
        retryEnabled: true,
        maxAttempts: 5,
      },
      library,
    }),
  );

  expect(result.attemptsRemaining).toBe(5);
});

test("toggle without prior config reports a configure error", async () => {
  const state = await withFollower((follower) => follower.toggle(library));

  expect(state).toEqual({
    enabled: false,
    running: false,
    targetName: "",
    phase: "stopped",
    attemptsRemaining: 3,
    lastError: "Configure follower before using the hotkey",
    stoppedReason: "Target not found",
  });
});

test("toggle restarts last configured follower", async () => {
  const result = await withFollower((follower, harness) =>
    Effect.gen(function* () {
      yield* follower.start({
        config: {
          targetName: "hero",
          selectedProfileId: "void-highlord",
        },
        library,
      });
      yield* follower.stop();
      const state = yield* follower.toggle(library);
      return { state, startedJobs: harness.startedJobs };
    }),
  );

  expect(result.state).toMatchObject({
    enabled: true,
    running: true,
    targetName: "hero",
    profileId: "void-highlord",
  });
  expect(result.startedJobs).toEqual([
    "features:follower",
    "features:follower",
  ]);
});
