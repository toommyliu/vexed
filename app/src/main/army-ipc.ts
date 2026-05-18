import { existsSync } from "fs";
import { app, BrowserWindow, ipcMain, type WebContents } from "electron";
import {
  ArmyIpcChannels,
  type ArmyBarrierPayload,
  type ArmyLeavePayload,
  type ArmySessionPayload,
  type ArmyStartPayload,
  type ArmyStatusPayload,
  type ArmyStatusResult,
} from "../shared/ipc";
import {
  assertValidArmyConfigName,
  normalizeArmyConfig,
  type ArmyConfigPayload,
} from "../shared/army";
import * as Files from "./settings/Files";

const ARMY_START_TIMEOUT_MS = 120_000;
const ARMY_BARRIER_TIMEOUT_MS = 30 * 60_000;

interface DeferredVoid {
  readonly playerName: string;
  resolve(): void;
  reject(error: Error): void;
}

interface PendingStart {
  readonly playerName: string;
  readonly senderWindow: BrowserWindow;
  readonly timer: ReturnType<typeof setTimeout>;
  resolve(value: ArmySessionPayload): void;
  reject(error: Error): void;
}

interface ArmyBarrierState {
  readonly step: number;
  readonly label?: string;
  readonly expectedPlayerKeys: ReadonlySet<string>;
  readonly expectedPlayers: readonly string[];
  readonly arrived: Map<string, DeferredVoid>;
  readonly timer: ReturnType<typeof setTimeout>;
}

interface ArmySessionState extends ArmyConfigPayload {
  readonly sessionId: string;
  readonly playerKeys: ReadonlySet<string>;
  readonly windows: Map<string, BrowserWindow>;
  readonly barriers: Map<number, ArmyBarrierState>;
}

let armyIpcRegistered = false;
let nextSessionId = 0;

const sessions = new Map<string, ArmySessionState>();
const activeSessionByConfig = new Map<string, string>();
const pendingStartsByConfig = new Map<string, PendingStart[]>();
const windowSessionIds = new WeakMap<BrowserWindow, Set<string>>();
const trackedWindows = new WeakSet<BrowserWindow>();

const normalizePlayerName = (name: string): string => name.trim().toLowerCase();

const getArmyConfigPath = (configName: string): string =>
  Files.workspaceJoin("army", `${assertValidArmyConfigName(configName)}.yaml`);

const getSenderWindow = (sender: WebContents): BrowserWindow => {
  const senderWindow = BrowserWindow.fromWebContents(sender);
  if (!senderWindow) {
    throw new Error("Army IPC requires a sender window");
  }

  return senderWindow;
};

const readArmyConfig = (configNameInput: string): ArmyConfigPayload => {
  const configName = assertValidArmyConfigName(configNameInput);
  const path = getArmyConfigPath(configName);
  if (!existsSync(path)) {
    throw new Error(`Army config not found: ${path}`);
  }

  const raw = Files.readYaml(path);
  if (raw === undefined) {
    throw new Error(`Army config could not be parsed: ${path}`);
  }

  return normalizeArmyConfig(configName, raw);
};

const parseStartPayload = (payload: unknown): ArmyStartPayload => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error("Invalid army start payload");
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record["configName"] !== "string" ||
    typeof record["playerName"] !== "string" ||
    record["playerName"].trim() === ""
  ) {
    throw new Error("Invalid army start payload");
  }

  return {
    configName: record["configName"],
    playerName: record["playerName"],
  };
};

const parseLeavePayload = (payload: unknown): ArmyLeavePayload => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error("Invalid army leave payload");
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record["sessionId"] !== "string" ||
    record["sessionId"].trim() === ""
  ) {
    throw new Error("Invalid army leave payload");
  }

  const playerName = record["playerName"];
  if (playerName !== undefined && typeof playerName !== "string") {
    throw new Error("Invalid army leave payload");
  }

  return {
    sessionId: record["sessionId"],
    ...(typeof playerName === "string" ? { playerName } : null),
  };
};

const parseBarrierPayload = (payload: unknown): ArmyBarrierPayload => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error("Invalid army barrier payload");
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record["sessionId"] !== "string" ||
    record["sessionId"].trim() === "" ||
    typeof record["playerName"] !== "string" ||
    record["playerName"].trim() === "" ||
    typeof record["step"] !== "number" ||
    !Number.isInteger(record["step"]) ||
    record["step"] < 0
  ) {
    throw new Error("Invalid army barrier payload");
  }

  const label = record["label"];
  const players = record["players"];
  const timeoutMs = record["timeoutMs"];
  if (label !== undefined && typeof label !== "string") {
    throw new Error("Invalid army barrier payload");
  }

  if (players !== undefined && !Array.isArray(players)) {
    throw new Error("Invalid army barrier payload");
  }

  if (
    timeoutMs !== undefined &&
    (typeof timeoutMs !== "number" ||
      !Number.isFinite(timeoutMs) ||
      timeoutMs <= 0)
  ) {
    throw new Error("Invalid army barrier payload");
  }

  const normalizedPlayers: string[] = [];
  if (players !== undefined) {
    const seen = new Set<string>();
    for (const player of players) {
      if (typeof player !== "string" || player.trim() === "") {
        throw new Error("Invalid army barrier payload");
      }

      const normalized = player.trim();
      const key = normalizePlayerName(normalized);
      if (seen.has(key)) {
        throw new Error("Invalid army barrier payload");
      }

      seen.add(key);
      normalizedPlayers.push(normalized);
    }

    if (normalizedPlayers.length === 0) {
      throw new Error("Invalid army barrier payload");
    }
  }

  return {
    sessionId: record["sessionId"],
    playerName: record["playerName"],
    step: record["step"],
    ...(typeof label === "string" && label.trim() !== ""
      ? { label: label.trim() }
      : null),
    ...(players === undefined ? null : { players: normalizedPlayers }),
    ...(typeof timeoutMs === "number" ? { timeoutMs } : null),
  };
};

const parseStatusPayload = (payload: unknown): ArmyStatusPayload => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error("Invalid army status payload");
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record["sessionId"] !== "string" ||
    record["sessionId"].trim() === ""
  ) {
    throw new Error("Invalid army status payload");
  }

  return { sessionId: record["sessionId"] };
};

const resolvePlayerNumber = (
  session: Pick<ArmySessionState, "players">,
  playerName: string,
): number => {
  const playerKey = normalizePlayerName(playerName);
  const index = session.players.findIndex(
    (player) => normalizePlayerName(player) === playerKey,
  );
  return index < 0 ? -1 : index + 1;
};

const toSessionPayload = (
  session: ArmySessionState,
  playerName: string,
): ArmySessionPayload => {
  const leaderKey = normalizePlayerName(session.leader);
  const playerKey = normalizePlayerName(playerName);
  return {
    configName: session.configName,
    leader: session.leader,
    players: session.players,
    raw: session.raw,
    roomNumber: session.roomNumber,
    sessionId: session.sessionId,
    playerName,
    playerNumber: resolvePlayerNumber(session, playerName),
    role: playerKey === leaderKey ? "leader" : "member",
  };
};

const rejectBarrier = (barrier: ArmyBarrierState, error: Error): void => {
  clearTimeout(barrier.timer);
  for (const waiter of barrier.arrived.values()) {
    waiter.reject(error);
  }
  barrier.arrived.clear();
};

const abortSession = (session: ArmySessionState, reason: string): void => {
  sessions.delete(session.sessionId);

  if (activeSessionByConfig.get(session.configName) === session.sessionId) {
    activeSessionByConfig.delete(session.configName);
  }

  for (const barrier of session.barriers.values()) {
    rejectBarrier(barrier, new Error(reason));
  }
  session.barriers.clear();

  for (const window of session.windows.values()) {
    const windowSessions = windowSessionIds.get(window);
    windowSessions?.delete(session.sessionId);
  }
  session.windows.clear();
};

const abortWindowSessions = (window: BrowserWindow, reason: string): void => {
  const sessionIds = windowSessionIds.get(window);
  if (!sessionIds) {
    return;
  }

  for (const sessionId of [...sessionIds]) {
    const session = sessions.get(sessionId);
    if (session) {
      abortSession(session, reason);
    }
  }

  sessionIds.clear();
};

const trackWindow = (window: BrowserWindow): void => {
  if (trackedWindows.has(window)) {
    return;
  }

  trackedWindows.add(window);
  window.once("closed", () =>
    abortWindowSessions(window, "Army window closed"),
  );
  window.webContents.once("destroyed", () =>
    abortWindowSessions(window, "Army window destroyed"),
  );
};

const attachWindow = (
  session: ArmySessionState,
  window: BrowserWindow,
  playerName: string,
): void => {
  const playerKey = normalizePlayerName(playerName);
  if (!session.playerKeys.has(playerKey)) {
    throw new Error(`Player is not in army config: ${playerName}`);
  }

  const existingWindow = session.windows.get(playerKey);
  if (
    existingWindow &&
    existingWindow !== window &&
    !existingWindow.isDestroyed()
  ) {
    throw new Error(`Army player already joined: ${playerName}`);
  }

  session.windows.set(playerKey, window);
  let sessionIds = windowSessionIds.get(window);
  if (!sessionIds) {
    sessionIds = new Set<string>();
    windowSessionIds.set(window, sessionIds);
  }
  sessionIds.add(session.sessionId);
  trackWindow(window);
};

const rejectPendingStarts = (configName: string, error: Error): void => {
  const pending = pendingStartsByConfig.get(configName);
  if (!pending) {
    return;
  }

  pendingStartsByConfig.delete(configName);
  for (const waiter of pending) {
    clearTimeout(waiter.timer);
    waiter.reject(error);
  }
};

const resolvePendingStarts = (session: ArmySessionState): void => {
  const pending = pendingStartsByConfig.get(session.configName);
  if (!pending) {
    return;
  }

  pendingStartsByConfig.delete(session.configName);
  for (const waiter of pending) {
    clearTimeout(waiter.timer);
    try {
      attachWindow(session, waiter.senderWindow, waiter.playerName);
      waiter.resolve(toSessionPayload(session, waiter.playerName));
    } catch (error) {
      waiter.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }
};

const createSession = (
  config: ArmyConfigPayload,
  leaderWindow: BrowserWindow,
  leaderName: string,
): ArmySessionState => {
  const existingSessionId = activeSessionByConfig.get(config.configName);
  const existingSession = existingSessionId
    ? sessions.get(existingSessionId)
    : undefined;
  if (existingSession) {
    abortSession(
      existingSession,
      `Army config restarted: ${config.configName}`,
    );
  }

  const session: ArmySessionState = {
    ...config,
    sessionId: `${Date.now().toString(36)}-${nextSessionId++}`,
    playerKeys: new Set(config.players.map(normalizePlayerName)),
    windows: new Map<string, BrowserWindow>(),
    barriers: new Map<number, ArmyBarrierState>(),
  };

  sessions.set(session.sessionId, session);
  activeSessionByConfig.set(session.configName, session.sessionId);
  attachWindow(session, leaderWindow, leaderName);
  resolvePendingStarts(session);
  return session;
};

const waitForLeaderSession = (
  configName: string,
  senderWindow: BrowserWindow,
  playerName: string,
): Promise<ArmySessionPayload> =>
  new Promise((resolve, reject) => {
    let waiter: PendingStart;
    const timer = setTimeout(() => {
      const pending = pendingStartsByConfig.get(configName);
      if (pending) {
        const remaining = pending.filter(
          (pendingWaiter) => pendingWaiter !== waiter,
        );
        if (remaining.length > 0) {
          pendingStartsByConfig.set(configName, remaining);
        } else {
          pendingStartsByConfig.delete(configName);
        }
      }
      reject(new Error(`Timed out waiting for army leader: ${configName}`));
    }, ARMY_START_TIMEOUT_MS);

    waiter = {
      playerName,
      senderWindow,
      timer,
      resolve,
      reject,
    };
    pendingStartsByConfig.set(configName, [
      ...(pendingStartsByConfig.get(configName) ?? []),
      waiter,
    ]);
  });

const releaseBarrierIfComplete = (
  session: ArmySessionState,
  barrier: ArmyBarrierState,
): void => {
  if (barrier.arrived.size < barrier.expectedPlayerKeys.size) {
    return;
  }

  clearTimeout(barrier.timer);
  session.barriers.delete(barrier.step);
  for (const waiter of barrier.arrived.values()) {
    waiter.resolve();
  }
  barrier.arrived.clear();
};

const getBarrierTimeoutMs = (payload: ArmyBarrierPayload): number =>
  Math.max(1, Math.trunc(payload.timeoutMs ?? ARMY_BARRIER_TIMEOUT_MS));

const resolveBarrierExpectedPlayers = (
  session: ArmySessionState,
  payload: ArmyBarrierPayload,
): {
  readonly keys: ReadonlySet<string>;
  readonly players: readonly string[];
} => {
  if (payload.players === undefined) {
    return {
      keys: session.playerKeys,
      players: session.players,
    };
  }

  const canonicalPlayersByKey = new Map(
    session.players.map(
      (player) => [normalizePlayerName(player), player] as const,
    ),
  );
  const keys = new Set<string>();
  const players: string[] = [];

  for (const player of payload.players) {
    const key = normalizePlayerName(player);
    const canonicalPlayer = canonicalPlayersByKey.get(key);
    if (canonicalPlayer === undefined) {
      throw new Error(`Player is not in army config: ${player}`);
    }

    if (keys.has(key)) {
      throw new Error(`Duplicate army barrier player: ${player}`);
    }

    keys.add(key);
    players.push(canonicalPlayer);
  }

  return { keys, players };
};

const samePlayerSet = (
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): boolean => {
  if (left.size !== right.size) {
    return false;
  }

  for (const key of left) {
    if (!right.has(key)) {
      return false;
    }
  }

  return true;
};

const waitAtBarrier = (
  session: ArmySessionState,
  playerName: string,
  payload: ArmyBarrierPayload,
): Promise<void> => {
  const playerKey = normalizePlayerName(playerName);
  if (!session.playerKeys.has(playerKey)) {
    return Promise.reject(
      new Error(`Player is not in army config: ${playerName}`),
    );
  }

  if (!session.windows.has(playerKey)) {
    return Promise.reject(
      new Error(`Army player has not joined: ${playerName}`),
    );
  }

  let expectedPlayers: {
    readonly keys: ReadonlySet<string>;
    readonly players: readonly string[];
  };
  try {
    expectedPlayers = resolveBarrierExpectedPlayers(session, payload);
  } catch (error) {
    return Promise.reject(error);
  }

  if (!expectedPlayers.keys.has(playerKey)) {
    return Promise.resolve();
  }

  let barrier = session.barriers.get(payload.step);
  if (!barrier) {
    const step = payload.step;
    const timer = setTimeout(() => {
      const current = session.barriers.get(step);
      if (!current) {
        return;
      }

      const arrived = new Set(current.arrived.keys());
      const missing = current.expectedPlayers.filter(
        (player) => !arrived.has(normalizePlayerName(player)),
      );
      session.barriers.delete(step);
      rejectBarrier(
        current,
        new Error(
          `Timed out waiting for army step ${step}${
            current.label ? ` (${current.label})` : ""
          }; missing: ${missing.join(", ")}`,
        ),
      );
    }, getBarrierTimeoutMs(payload));

    barrier = {
      step,
      ...(payload.label !== undefined ? { label: payload.label } : null),
      expectedPlayerKeys: expectedPlayers.keys,
      expectedPlayers: expectedPlayers.players,
      arrived: new Map<string, DeferredVoid>(),
      timer,
    };
    session.barriers.set(payload.step, barrier);
  }

  if (barrier.arrived.has(playerKey)) {
    return Promise.reject(
      new Error(
        `Army player already reached step ${payload.step}: ${playerName}`,
      ),
    );
  }

  if (
    payload.label !== undefined &&
    barrier.label !== undefined &&
    payload.label !== barrier.label
  ) {
    return Promise.reject(
      new Error(
        `Army step label mismatch for step ${payload.step}: expected ${barrier.label}, got ${payload.label}`,
      ),
    );
  }

  if (!samePlayerSet(barrier.expectedPlayerKeys, expectedPlayers.keys)) {
    return Promise.reject(
      new Error(`Army step player set mismatch for step ${payload.step}`),
    );
  }

  return new Promise((resolve, reject) => {
    barrier.arrived.set(playerKey, { playerName, resolve, reject });
    releaseBarrierIfComplete(session, barrier);
  });
};

export const registerArmyIpcHandlers = (): void => {
  if (armyIpcRegistered) {
    return;
  }

  ipcMain.handle(ArmyIpcChannels.loadConfig, async (_event, fileName) => {
    if (typeof fileName !== "string") {
      throw new Error("Army config name is required");
    }

    return readArmyConfig(fileName);
  });

  ipcMain.handle(ArmyIpcChannels.start, async (event, rawPayload) => {
    const payload = parseStartPayload(rawPayload);
    const config = readArmyConfig(payload.configName);
    const senderWindow = getSenderWindow(event.sender);
    const playerNumber = resolvePlayerNumber(config, payload.playerName);
    if (playerNumber < 1) {
      throw new Error(`Player is not in army config: ${payload.playerName}`);
    }

    const activeSessionId = activeSessionByConfig.get(config.configName);
    const activeSession = activeSessionId
      ? sessions.get(activeSessionId)
      : undefined;
    if (activeSession) {
      attachWindow(activeSession, senderWindow, payload.playerName);
      return toSessionPayload(activeSession, payload.playerName);
    }

    if (
      normalizePlayerName(payload.playerName) ===
      normalizePlayerName(config.leader)
    ) {
      const session = createSession(config, senderWindow, payload.playerName);
      return toSessionPayload(session, payload.playerName);
    }

    return await waitForLeaderSession(
      config.configName,
      senderWindow,
      payload.playerName,
    );
  });

  ipcMain.handle(ArmyIpcChannels.leave, async (_event, rawPayload) => {
    const payload = parseLeavePayload(rawPayload);
    const session = sessions.get(payload.sessionId);
    if (!session) {
      return;
    }

    abortSession(
      session,
      payload.playerName === undefined
        ? "Army session left"
        : `Army player left: ${payload.playerName}`,
    );
  });

  ipcMain.handle(ArmyIpcChannels.barrier, async (_event, rawPayload) => {
    const payload = parseBarrierPayload(rawPayload);
    const session = sessions.get(payload.sessionId);
    if (!session) {
      throw new Error("Army session is not active");
    }

    await waitAtBarrier(session, payload.playerName, payload);
  });

  ipcMain.handle(ArmyIpcChannels.status, async (_event, rawPayload) => {
    const payload = parseStatusPayload(rawPayload);
    const session = sessions.get(payload.sessionId);
    if (!session) {
      return { active: false } satisfies ArmyStatusResult;
    }

    return {
      active: true,
      configName: session.configName,
      players: session.players,
      joinedPlayers: [...session.windows.keys()],
      waitingBarriers: session.barriers.size,
    } satisfies ArmyStatusResult;
  });

  app.once("before-quit", () => {
    for (const session of [...sessions.values()]) {
      abortSession(session, "Application is quitting");
    }
    for (const configName of [...pendingStartsByConfig.keys()]) {
      rejectPendingStarts(configName, new Error("Application is quitting"));
    }
  });

  armyIpcRegistered = true;
};
