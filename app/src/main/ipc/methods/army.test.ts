import { EventEmitter } from "node:events";
import type { IpcMainInvokeEvent, WebContents } from "electron";
import { Effect, Exit, Fiber, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ArmyConfigPayload } from "../../../shared/army";
import {
  ArmyIpcChannels,
  type ArmyBarrierPayload,
  type ArmyLoopTauntCommandPayload,
  type ArmyLoopTauntObservationPayload,
  type ArmyLoopTauntStartPayload,
  type ArmySessionPayload,
  type ArmyStatusResult,
} from "../../../shared/ipc";
import {
  WorkspaceFiles,
  type WorkspaceFilesShape,
} from "../../workspace/WorkspaceFiles";
import { MainIpc, type MainIpcShape } from "../MainIpc";
import { registerArmyIpcHandlers } from "./army";

const electronMock = vi.hoisted(() => {
  const windowsByWebContents = new WeakMap<object, unknown>();

  return {
    windowsByWebContents,
    BrowserWindow: {
      fromWebContents: vi.fn((webContents: object) =>
        windowsByWebContents.get(webContents) ?? null,
      ),
    },
  };
});

vi.mock("electron", () => ({
  BrowserWindow: electronMock.BrowserWindow,
}));

class FakeWebContents extends EventEmitter {
  public readonly id: number;
  public readonly sent: Array<{
    readonly channel: string;
    readonly payload: unknown;
  }> = [];
  private destroyed = false;

  public constructor(id: number) {
    super();
    this.id = id;
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public destroy(): void {
    this.destroyed = true;
    this.emit("destroyed");
  }

  public send(channel: string, payload: unknown): void {
    this.sent.push({ channel, payload });
    this.emit(channel, payload);
  }
}

class FakeWindow extends EventEmitter {
  public readonly webContents: FakeWebContents;
  private destroyed = false;

  public constructor(id: number) {
    super();
    this.webContents = new FakeWebContents(id);
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public destroy(): void {
    this.destroyed = true;
    this.emit("closed");
    this.webContents.destroy();
  }
}

type CapturedHandler = (
  event: IpcMainInvokeEvent,
  ...args: readonly unknown[]
) => Effect.Effect<unknown, unknown, unknown>;

interface ArmyIpcHarness {
  readonly start: (
    playerName: string,
  ) => Effect.Effect<ArmySessionPayload, unknown>;
  readonly barrier: (
    session: ArmySessionPayload,
    playerName: string,
    payload: Omit<ArmyBarrierPayload, "sessionId" | "playerName">,
  ) => Effect.Effect<void, unknown>;
  readonly status: (
    session: ArmySessionPayload,
  ) => Effect.Effect<ArmyStatusResult, unknown>;
  readonly startLoopTaunt: (
    session: ArmySessionPayload,
    payload: Omit<ArmyLoopTauntStartPayload, "playerName" | "sessionId">,
    playerName?: string,
    senderPlayerName?: string,
  ) => Effect.Effect<void, unknown>;
  readonly publishLoopTauntObservation: (
    session: ArmySessionPayload,
    payload: Omit<ArmyLoopTauntObservationPayload, "playerName" | "sessionId">,
    playerName?: string,
    senderPlayerName?: string,
  ) => Effect.Effect<void, unknown>;
  readonly detachedStartLoopTaunt: (
    session: ArmySessionPayload,
    payload: Omit<ArmyLoopTauntStartPayload, "playerName" | "sessionId">,
    playerName?: string,
  ) => Effect.Effect<void, unknown>;
  readonly commandsFor: (
    playerName: string,
  ) => readonly ArmyLoopTauntCommandPayload[];
}

const config: ArmyConfigPayload = {
  configName: "barrier-test",
  leader: "Main",
  players: ["Main", "Alt", "Third", "Fourth"],
  raw: {},
  roomNumber: "1",
};

const makeWorkspace = (): WorkspaceFilesShape => ({
  scriptsDir: "/tmp/vexed-test-scripts",
  flashPluginPath: null,
  readScript: () => Effect.die("not used"),
  readArmyConfig: (configName) => Effect.succeed({ ...config, configName }),
});

const exitString = <A, E>(exit: Exit.Exit<A, E>): string =>
  Exit.match(exit, {
    onFailure: (cause) => String(cause),
    onSuccess: () => "",
  });

const withArmyIpc = async <A>(
  body: (harness: ArmyIpcHarness) => Effect.Effect<A, unknown>,
): Promise<A> => {
  const handlers = new Map<string, CapturedHandler>();
  const windowsByPlayer = new Map<string, FakeWindow>();
  let nextWindowId = 1;

  const makeEvent = (): IpcMainInvokeEvent => {
    const window = new FakeWindow(nextWindowId++);
    electronMock.windowsByWebContents.set(window.webContents, window);
    return {
      sender: window.webContents as unknown as WebContents,
    } as IpcMainInvokeEvent;
  };

  const makePlayerEvent = (playerName: string): IpcMainInvokeEvent => {
    const window = windowsByPlayer.get(playerName.toLowerCase());
    if (!window) {
      throw new Error(`No test window for player: ${playerName}`);
    }

    return {
      sender: window.webContents as unknown as WebContents,
    } as IpcMainInvokeEvent;
  };

  const invoke = <A>(
    channel: string,
    event: IpcMainInvokeEvent,
    ...args: readonly unknown[]
  ): Effect.Effect<A, unknown> => {
    const handler = handlers.get(channel);
    if (handler === undefined) {
      return Effect.die(new Error(`Missing IPC handler: ${channel}`));
    }

    return handler(event, ...args) as Effect.Effect<A, unknown>;
  };

  const ipc: MainIpcShape = {
    handle: (channel, handler) =>
      Effect.sync(() => {
        handlers.set(channel, handler as CapturedHandler);
      }),
    on: () => Effect.void,
  };

  const harness: ArmyIpcHarness = {
    start: (playerName) =>
      Effect.gen(function* () {
        const event = makeEvent();
        const session = yield* invoke<ArmySessionPayload>(
          ArmyIpcChannels.start,
          event,
          {
            configName: config.configName,
            playerName,
          },
        );
        const window = electronMock.windowsByWebContents.get(
          event.sender,
        ) as FakeWindow;
        windowsByPlayer.set(playerName.toLowerCase(), window);
        return session;
      }),
    barrier: (session, playerName, payload) =>
      invoke<void>(ArmyIpcChannels.barrier, makeEvent(), {
        ...payload,
        playerName,
        sessionId: session.sessionId,
      }),
    status: (session) =>
      invoke<ArmyStatusResult>(ArmyIpcChannels.status, makeEvent(), {
        sessionId: session.sessionId,
      }),
    startLoopTaunt: (
      session,
      payload,
      playerName = session.playerName,
      senderPlayerName = playerName,
    ) =>
      invoke<void>(ArmyIpcChannels.loopTauntStart, makePlayerEvent(senderPlayerName), {
        ...payload,
        playerName,
        sessionId: session.sessionId,
      }),
    publishLoopTauntObservation: (
      session,
      payload,
      playerName = session.playerName,
      senderPlayerName = playerName,
    ) =>
      invoke<void>(ArmyIpcChannels.loopTauntObservation, makePlayerEvent(senderPlayerName), {
        ...payload,
        playerName,
        sessionId: session.sessionId,
      }),
    detachedStartLoopTaunt: (session, payload, playerName = session.playerName) =>
      invoke<void>(ArmyIpcChannels.loopTauntStart, makeEvent(), {
        ...payload,
        playerName,
        sessionId: session.sessionId,
      }),
    commandsFor: (playerName) =>
      (windowsByPlayer.get(playerName.toLowerCase())?.webContents.sent ?? [])
        .filter((event) => event.channel === ArmyIpcChannels.loopTauntCommand)
        .map((event) => event.payload as ArmyLoopTauntCommandPayload),
  };

  return Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        yield* registerArmyIpcHandlers();
        return yield* body(harness);
      }),
    ).pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(MainIpc)(ipc),
          Layer.succeed(WorkspaceFiles)(makeWorkspace()),
        ),
      ),
    ),
  );
};

const startFullArmy = (harness: ArmyIpcHarness) =>
  Effect.gen(function* () {
    const session = yield* harness.start("Main");
    yield* harness.start("Alt");
    yield* harness.start("Third");
    yield* harness.start("Fourth");
    return session;
  });

const loopTauntStartPayload = (
  overrides: Partial<
    Omit<ArmyLoopTauntStartPayload, "playerName" | "sessionId">
  > = {},
): Omit<ArmyLoopTauntStartPayload, "playerName" | "sessionId"> => ({
  aura: "Focus",
  delayMs: 4_000,
  id: "focus",
  participants: [
    { name: "Main", number: 1 },
    { name: "Alt", number: 2 },
  ],
  skill: 5,
  targetMonMapId: 1,
  ...overrides,
});

describe("army IPC barriers", () => {
  beforeEach(() => {
    electronMock.BrowserWindow.fromWebContents.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("releases same-step same-label barriers with the same expected players", async () => {
    const status = await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        const main = yield* Effect.forkDetach(
          harness.barrier(session, "Main", {
            label: "same",
            players: ["Main", "Alt"],
            step: 1,
          }),
          { startImmediately: true },
        );

        yield* Effect.sleep("1 millis");
        yield* harness.barrier(session, "Alt", {
          label: "same",
          players: ["Main", "Alt"],
          step: 1,
        });
        yield* Fiber.join(main);
        return yield* harness.status(session);
      }),
    );

    expect(status.waitingBarriers).toBe(0);
  });

  it("rejects same-step same-label barriers with different expected players", async () => {
    const result = await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        const main = yield* Effect.forkDetach(
          harness.barrier(session, "Main", {
            label: "same",
            players: ["Main", "Alt"],
            step: 2,
          }),
          { startImmediately: true },
        );

        yield* Effect.sleep("1 millis");
        const exit = yield* Effect.exit(
          harness.barrier(session, "Third", {
            label: "same",
            players: ["Third", "Fourth"],
            step: 2,
          }),
        );

        yield* harness.barrier(session, "Alt", {
          label: "same",
          players: ["Main", "Alt"],
          step: 2,
        });
        yield* Fiber.join(main);

        return {
          exit,
          status: yield* harness.status(session),
        };
      }),
    );

    expect(Exit.isFailure(result.exit)).toBe(true);
    expect(exitString(result.exit)).toContain("Army step player set mismatch");
    expect(result.status.waitingBarriers).toBe(0);
  });

  it("allows same-step different-label barriers with disjoint expected players", async () => {
    const result = await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        const executioner = yield* Effect.forkDetach(
          harness.barrier(session, "Main", {
            label: "loop-taunt-target:executioner",
            players: ["Main", "Alt"],
            step: 3,
          }),
          { startImmediately: true },
        );
        const bowmaster = yield* Effect.forkDetach(
          harness.barrier(session, "Third", {
            label: "loop-taunt-target:bowmaster",
            players: ["Third", "Fourth"],
            step: 3,
          }),
          { startImmediately: true },
        );

        yield* Effect.sleep("1 millis");
        const pendingStatus = yield* harness.status(session);

        yield* harness.barrier(session, "Alt", {
          label: "loop-taunt-target:executioner",
          players: ["Main", "Alt"],
          step: 3,
        });
        yield* harness.barrier(session, "Fourth", {
          label: "loop-taunt-target:bowmaster",
          players: ["Third", "Fourth"],
          step: 3,
        });
        yield* Fiber.join(executioner);
        yield* Fiber.join(bowmaster);

        return {
          pendingStatus,
          releasedStatus: yield* harness.status(session),
        };
      }),
    );

    expect(result.pendingStatus.waitingBarriers).toBe(2);
    expect(result.releasedStatus.waitingBarriers).toBe(0);
  });

  it("keeps same-step different-label all-player barriers separate until timeout", async () => {
    const result = await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        const left = yield* Effect.forkDetach(
          harness.barrier(session, "Main", {
            label: "left",
            step: 4,
            timeoutMs: 10,
          }),
          { startImmediately: true },
        );
        const right = yield* Effect.forkDetach(
          harness.barrier(session, "Third", {
            label: "right",
            step: 4,
            timeoutMs: 10,
          }),
          { startImmediately: true },
        );

        yield* Effect.sleep("1 millis");
        const pendingStatus = yield* harness.status(session);
        yield* Effect.sleep("20 millis");

        const leftExit = yield* Effect.exit(Fiber.join(left));
        const rightExit = yield* Effect.exit(Fiber.join(right));

        return {
          leftExit,
          pendingStatus,
          rightExit,
          releasedStatus: yield* harness.status(session),
        };
      }),
    );

    expect(result.pendingStatus.waitingBarriers).toBe(2);
    expect(Exit.isFailure(result.leftExit)).toBe(true);
    expect(exitString(result.leftExit)).toContain(
      "Timed out waiting for army step 4 (left)",
    );
    expect(Exit.isFailure(result.rightExit)).toBe(true);
    expect(exitString(result.rightExit)).toContain(
      "Timed out waiting for army step 4 (right)",
    );
    expect(result.releasedStatus.waitingBarriers).toBe(0);
  });
});

describe("army loop taunt coordinator", () => {
  beforeEach(() => {
    electronMock.BrowserWindow.fromWebContents.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects malformed loop taunt IPC payload values", async () => {
    const result = await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        yield* harness.startLoopTaunt(session, loopTauntStartPayload(), "Main");

        const blankSkill = yield* Effect.exit(
          harness.startLoopTaunt(
            session,
            loopTauntStartPayload({ skill: " " }),
            "Main",
          ),
        );
        const fractionalSkill = yield* Effect.exit(
          harness.startLoopTaunt(
            session,
            loopTauntStartPayload({ skill: 1.5 }),
            "Main",
          ),
        );
        const invalidOutcome = yield* Effect.exit(
          harness.publishLoopTauntObservation(session, {
            id: "focus",
            outcome: "ignored" as never,
            targetMonMapId: 1,
            type: "cast-outcome",
          }),
        );
        const invalidReason = yield* Effect.exit(
          harness.publishLoopTauntObservation(session, {
            id: "focus",
            reason: "ignored" as never,
            targetMonMapId: 1,
            type: "cast-outcome",
          }),
        );

        return {
          blankSkill,
          fractionalSkill,
          invalidOutcome,
          invalidReason,
        };
      }),
    );

    expect(Exit.isFailure(result.blankSkill)).toBe(true);
    expect(Exit.isFailure(result.fractionalSkill)).toBe(true);
    expect(Exit.isFailure(result.invalidOutcome)).toBe(true);
    expect(Exit.isFailure(result.invalidReason)).toBe(true);
  });

  it("rejects loop taunt starts from unattached windows", async () => {
    const result = await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        return yield* Effect.exit(
          harness.detachedStartLoopTaunt(
            session,
            loopTauntStartPayload(),
            "Main",
          ),
        );
      }),
    );

    expect(Exit.isFailure(result)).toBe(true);
    expect(exitString(result)).toContain(
      "Army sender is not attached to this session",
    );
  });

  it("waits configured delay before commanding after Focus removal", async () => {
    await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        yield* harness.startLoopTaunt(
          session,
          loopTauntStartPayload({ delayMs: 1_000 }),
          "Main",
        );
        yield* harness.publishLoopTauntObservation(session, {
          auraName: "Focus",
          id: "focus",
          targetMonMapId: 1,
          type: "aura-removed",
        });

        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(999));
        expect(harness.commandsFor("Main")).toHaveLength(0);

        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(1));
        expect(harness.commandsFor("Main")).toHaveLength(1);
      }),
    );
  });

  it("uses the default 4000ms aura delay", async () => {
    await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        yield* harness.startLoopTaunt(
          session,
          loopTauntStartPayload(),
          "Main",
        );
        yield* harness.publishLoopTauntObservation(session, {
          auraName: "Focus",
          id: "focus",
          targetMonMapId: 1,
          type: "aura-removed",
        });

        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(3_999));
        expect(harness.commandsFor("Main")).toHaveLength(0);

        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(1));
        expect(harness.commandsFor("Main")).toHaveLength(1);
      }),
    );
  });

  it("dedupes duplicate Focus removal reports into one epoch", async () => {
    await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        yield* harness.startLoopTaunt(
          session,
          loopTauntStartPayload({ delayMs: 0 }),
          "Main",
        );
        yield* harness.publishLoopTauntObservation(session, {
          auraName: "Focus",
          id: "focus",
          targetMonMapId: 1,
          type: "aura-removed",
        });
        yield* harness.publishLoopTauntObservation(
          session,
          {
            auraName: "Focus",
            id: "focus",
            targetMonMapId: 1,
            type: "aura-removed",
          },
          "Alt",
        );

        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(0));
        expect(harness.commandsFor("Main")).toHaveLength(1);
        expect(harness.commandsFor("Main")[0]?.epoch).toBe(1);
      }),
    );
  });

  it("does one retry then hands off when Focus never returns", async () => {
    await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        yield* harness.startLoopTaunt(
          session,
          loopTauntStartPayload({ delayMs: 0 }),
          "Main",
        );
        yield* harness.publishLoopTauntObservation(session, {
          auraName: "Focus",
          id: "focus",
          targetMonMapId: 1,
          type: "aura-missing",
        });

        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(0));
        expect(harness.commandsFor("Main")).toHaveLength(1);

        yield* Effect.promise(() =>
          vi.advanceTimersByTimeAsync(1_500 + 2_500),
        );
        expect(harness.commandsFor("Main")).toHaveLength(2);
        expect(harness.commandsFor("Main")[1]?.attempt).toBe(2);

        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(1_500));
        yield* Effect.promise(() => vi.runOnlyPendingTimersAsync());
        const altCommands = harness.commandsFor("Alt");
        expect(altCommands).toHaveLength(1);
        expect(altCommands[0]?.epoch).toBe(2);
      }),
    );
  });

  it("cancels retry and handoff when Focus is restored", async () => {
    await withArmyIpc((harness) =>
      Effect.gen(function* () {
        const session = yield* startFullArmy(harness);
        yield* harness.startLoopTaunt(
          session,
          loopTauntStartPayload({ delayMs: 0 }),
          "Main",
        );
        yield* harness.publishLoopTauntObservation(session, {
          auraName: "Focus",
          id: "focus",
          targetMonMapId: 1,
          type: "aura-missing",
        });
        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(0));
        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(1_000));
        yield* harness.publishLoopTauntObservation(session, {
          auraIcon: "iwd1,ied1",
          auraName: "Focus",
          id: "focus",
          targetMonMapId: 1,
          type: "aura-added",
        });
        yield* Effect.promise(() => vi.advanceTimersByTimeAsync(10_000));

        expect(
          harness
            .commandsFor("Main")
            .filter((command) => command.selected.name === "Main"),
        ).toHaveLength(1);
        expect(
          harness
            .commandsFor("Alt")
            .filter((command) => command.selected.name === "Alt"),
        ).toHaveLength(0);
      }),
    );
  });
});
