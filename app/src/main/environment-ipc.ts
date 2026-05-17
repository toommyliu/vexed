import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import { Effect } from "effect";
import {
  addEnvironmentBoost,
  addEnvironmentItem,
  addEnvironmentQuest,
  clearEnvironmentBoosts,
  clearEnvironmentItems,
  clearEnvironmentQuestReward,
  clearEnvironmentQuests,
  clearEnvironmentState,
  createEmptyEnvironmentState,
  isEnvironmentItemRules,
  isEnvironmentQuestAutoRegisterOptions,
  normalizeEnvironmentState,
  removeEnvironmentBoost,
  removeEnvironmentItem,
  removeEnvironmentQuest,
  setEnvironmentItemRules,
  setEnvironmentQuestAutoRegisterOptions,
  setEnvironmentQuestReward,
  type EnvironmentState,
} from "../shared/environment";
import { EnvironmentIpcChannels } from "../shared/ipc";
import { WindowIds } from "../shared/windows";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "./windows";

type EnvironmentMutation = (state: EnvironmentState) => EnvironmentState;

const FETCH_BOOSTS_TIMEOUT_MS = 3_000;

let environmentIpcRegistered = false;
const states = new Map<number, EnvironmentState>();
const stateCleanupWindowIds = new Set<number>();
const pendingFetchBoosts = new Map<
  string,
  {
    readonly resolve: (boosts: readonly string[]) => void;
    readonly timeout: ReturnType<typeof setTimeout>;
  }
>();

const getSenderWindowId = (event: IpcMainInvokeEvent): number | undefined =>
  BrowserWindow.fromWebContents(event.sender)?.id;

const trackWindowState = (gameWindowId: number): void => {
  if (stateCleanupWindowIds.has(gameWindowId)) {
    return;
  }

  const window = BrowserWindow.fromId(gameWindowId);
  if (!window || window.isDestroyed()) {
    states.delete(gameWindowId);
    return;
  }

  stateCleanupWindowIds.add(gameWindowId);
  window.once("closed", () => {
    states.delete(gameWindowId);
    stateCleanupWindowIds.delete(gameWindowId);
  });
};

const getWindowState = (gameWindowId: number): EnvironmentState => {
  const existing = states.get(gameWindowId);
  if (existing) {
    return existing;
  }

  const empty = createEmptyEnvironmentState();
  states.set(gameWindowId, empty);
  trackWindowState(gameWindowId);
  return empty;
};

const setWindowState = (
  gameWindowId: number,
  state: EnvironmentState,
): EnvironmentState => {
  const normalized = normalizeEnvironmentState(state);
  states.set(gameWindowId, normalized);
  trackWindowState(gameWindowId);
  return normalized;
};

const sendChanged = (
  window: BrowserWindow | null,
  senderWindowId: number | undefined,
  state: EnvironmentState,
): void => {
  if (
    !window ||
    window.id === senderWindowId ||
    window.isDestroyed() ||
    window.webContents.isDestroyed()
  ) {
    return;
  }

  window.webContents.send(EnvironmentIpcChannels.changed, state);
};

const senderGameWindowId = (
  event: IpcMainInvokeEvent,
): Effect.Effect<number, WindowManagerError, WindowService> =>
  Effect.gen(function* () {
    const senderWindowId = getSenderWindowId(event);
    if (senderWindowId === undefined) {
      return yield* new WindowManagerError({
        message: "Missing sender window",
      });
    }

    const windows = yield* WindowService;
    const gameWindowId = yield* windows.getGameWindowId(senderWindowId);
    if (gameWindowId === undefined) {
      return yield* new WindowManagerError({
        message: "Missing parent game window",
      });
    }

    return gameWindowId;
  });

const notifyEnvironmentChanged = (
  gameWindowId: number,
  senderWindowId: number | undefined,
  state: EnvironmentState,
): Effect.Effect<void, never, WindowService> =>
  Effect.gen(function* () {
    const windows = yield* WindowService;
    const gameWindow = yield* windows.getGameWindow(gameWindowId);
    const environmentWindow = yield* windows.getGameChildWindow(
      gameWindowId,
      WindowIds.Environment,
    );

    sendChanged(gameWindow, senderWindowId, state);
    sendChanged(environmentWindow, senderWindowId, state);
  });

const applyEnvironmentMutation = (
  event: IpcMainInvokeEvent,
  mutation: EnvironmentMutation,
): Effect.Effect<EnvironmentState, WindowManagerError, WindowService> =>
  Effect.gen(function* () {
    const gameWindowId = yield* senderGameWindowId(event);
    const senderWindowId = getSenderWindowId(event);
    const nextState = setWindowState(
      gameWindowId,
      mutation(getWindowState(gameWindowId)),
    );

    yield* notifyEnvironmentChanged(gameWindowId, senderWindowId, nextState);
    return nextState;
  });

const fetchBoostsFromGameWindow = (
  gameWindow: BrowserWindow,
): Promise<readonly string[]> =>
  new Promise((resolve) => {
    const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const timeout = setTimeout(() => {
      pendingFetchBoosts.delete(requestId);
      resolve([]);
    }, FETCH_BOOSTS_TIMEOUT_MS);

    pendingFetchBoosts.set(requestId, { resolve, timeout });
    gameWindow.webContents.send(
      EnvironmentIpcChannels.fetchBoostsRequest,
      requestId,
    );
  });

export const registerEnvironmentIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): void => {
  if (environmentIpcRegistered) {
    return;
  }

  ipcMain.on(
    EnvironmentIpcChannels.fetchBoostsResponse,
    (_event, requestId: unknown, boosts: unknown) => {
      if (typeof requestId !== "string") {
        return;
      }

      const pending = pendingFetchBoosts.get(requestId);
      if (!pending) {
        return;
      }

      pendingFetchBoosts.delete(requestId);
      clearTimeout(pending.timeout);
      pending.resolve(Array.isArray(boosts) ? boosts.filter(isString) : []);
    },
  );

  ipcMain.handle(EnvironmentIpcChannels.getState, async (event) =>
    runWindowEffect(
      senderGameWindowId(event).pipe(Effect.map((id) => getWindowState(id))),
    ),
  );

  ipcMain.handle(EnvironmentIpcChannels.clear, async (event) =>
    runWindowEffect(applyEnvironmentMutation(event, clearEnvironmentState)),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.addQuest,
    async (event, questId: unknown, rewardItemId: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          addEnvironmentQuest(
            state,
            toQuestToken(questId),
            toOptionalQuestToken(rewardItemId),
          ),
        ),
      ),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.removeQuest,
    async (event, questId: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          removeEnvironmentQuest(state, toQuestToken(questId)),
        ),
      ),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.setQuestReward,
    async (event, questId: unknown, rewardItemId: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          setEnvironmentQuestReward(
            state,
            toQuestToken(questId),
            toQuestToken(rewardItemId),
          ),
        ),
      ),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.clearQuestReward,
    async (event, questId: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          clearEnvironmentQuestReward(state, toQuestToken(questId)),
        ),
      ),
  );

  ipcMain.handle(EnvironmentIpcChannels.clearQuests, async (event) =>
    runWindowEffect(applyEnvironmentMutation(event, clearEnvironmentQuests)),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.setQuestAutoRegister,
    async (event, options: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          setEnvironmentQuestAutoRegisterOptions(
            state,
            isEnvironmentQuestAutoRegisterOptions(options)
              ? options
              : state.questAutoRegister,
          ),
        ),
      ),
  );

  ipcMain.handle(EnvironmentIpcChannels.addItem, async (event, name: unknown) =>
    runWindowEffect(
      applyEnvironmentMutation(event, (state) =>
        addEnvironmentItem(state, String(name ?? "")),
      ),
    ),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.removeItem,
    async (event, name: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          removeEnvironmentItem(state, String(name ?? "")),
        ),
      ),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.setItemRules,
    async (event, rules: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          setEnvironmentItemRules(
            state,
            isEnvironmentItemRules(rules) ? rules : state.itemRules,
          ),
        ),
      ),
  );

  ipcMain.handle(EnvironmentIpcChannels.clearItems, async (event) =>
    runWindowEffect(applyEnvironmentMutation(event, clearEnvironmentItems)),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.addBoost,
    async (event, name: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          addEnvironmentBoost(state, String(name ?? "")),
        ),
      ),
  );

  ipcMain.handle(
    EnvironmentIpcChannels.removeBoost,
    async (event, name: unknown) =>
      runWindowEffect(
        applyEnvironmentMutation(event, (state) =>
          removeEnvironmentBoost(state, String(name ?? "")),
        ),
      ),
  );

  ipcMain.handle(EnvironmentIpcChannels.clearBoosts, async (event) =>
    runWindowEffect(applyEnvironmentMutation(event, clearEnvironmentBoosts)),
  );

  ipcMain.handle(EnvironmentIpcChannels.fetchBoosts, async (event) =>
    runWindowEffect(
      Effect.gen(function* () {
        const gameWindowId = yield* senderGameWindowId(event);
        const windows = yield* WindowService;
        const gameWindow = yield* windows.getGameWindow(gameWindowId);
        if (!gameWindow) {
          return [];
        }

        return yield* Effect.tryPromise({
          try: () => fetchBoostsFromGameWindow(gameWindow),
          catch: (cause) =>
            new WindowManagerError({
              message: "Failed to fetch environment boosts",
              cause,
            }),
        });
      }),
    ),
  );

  ipcMain.handle(EnvironmentIpcChannels.syncToAll, async (event) =>
    runWindowEffect(
      Effect.gen(function* () {
        const sourceGameWindowId = yield* senderGameWindowId(event);
        const senderWindowId = getSenderWindowId(event);
        const state = getWindowState(sourceGameWindowId);
        const windows = yield* WindowService;
        const gameWindowIds = yield* windows.getGameWindowIds;

        for (const gameWindowId of gameWindowIds) {
          setWindowState(gameWindowId, state);
          yield* notifyEnvironmentChanged(gameWindowId, senderWindowId, state);
        }

        return state;
      }),
    ),
  );

  environmentIpcRegistered = true;
};

const isString = (value: unknown): value is string => typeof value === "string";

const toQuestToken = (value: unknown): number | string =>
  typeof value === "number" || typeof value === "string" ? value : "";

const toOptionalQuestToken = (value: unknown): number | string | undefined =>
  typeof value === "number" || typeof value === "string" ? value : undefined;
