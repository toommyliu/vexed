import { BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { Effect, Scope } from "effect";
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
} from "../../../shared/environment";
import { EnvironmentIpcChannels } from "../../../shared/ipc";
import { makeRandomId } from "../../../shared/random-id";
import { WindowIds } from "../../../shared/windows";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "../../window/WindowService";
import { MainIpc } from "../MainIpc";

type EnvironmentMutation = (state: EnvironmentState) => EnvironmentState;

const FETCH_BOOSTS_TIMEOUT_MS = 3_000;

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
    const requestId = makeRandomId();
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
): Effect.Effect<void, never, MainIpc | Scope.Scope> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;
    const run = <A>(
      effect: Effect.Effect<A, WindowManagerError, WindowService>,
    ) => Effect.promise(() => runWindowEffect(effect));

    yield* ipc.on(
      EnvironmentIpcChannels.fetchBoostsResponse,
      (_event, requestId, boosts) =>
        Effect.sync(() => {
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
        }),
    );

    yield* ipc.handle(EnvironmentIpcChannels.getState, (event) =>
      run(
        senderGameWindowId(event).pipe(Effect.map((id) => getWindowState(id))),
      ),
    );

    yield* ipc.handle(EnvironmentIpcChannels.clear, (event) =>
      run(applyEnvironmentMutation(event, clearEnvironmentState)),
    );

    yield* ipc.handle(
      EnvironmentIpcChannels.addQuest,
      (event, questId, rewardItemId) =>
        run(
          applyEnvironmentMutation(event, (state) =>
            addEnvironmentQuest(
              state,
              toQuestToken(questId),
              toOptionalQuestToken(rewardItemId),
            ),
          ),
        ),
    );

    yield* ipc.handle(EnvironmentIpcChannels.removeQuest, (event, questId) =>
      run(
        applyEnvironmentMutation(event, (state) =>
          removeEnvironmentQuest(state, toQuestToken(questId)),
        ),
      ),
    );

    yield* ipc.handle(
      EnvironmentIpcChannels.setQuestReward,
      (event, questId, rewardItemId) =>
        run(
          applyEnvironmentMutation(event, (state) =>
            setEnvironmentQuestReward(
              state,
              toQuestToken(questId),
              toQuestToken(rewardItemId),
            ),
          ),
        ),
    );

    yield* ipc.handle(
      EnvironmentIpcChannels.clearQuestReward,
      (event, questId) =>
        run(
          applyEnvironmentMutation(event, (state) =>
            clearEnvironmentQuestReward(state, toQuestToken(questId)),
          ),
        ),
    );

    yield* ipc.handle(EnvironmentIpcChannels.clearQuests, (event) =>
      run(applyEnvironmentMutation(event, clearEnvironmentQuests)),
    );

    yield* ipc.handle(
      EnvironmentIpcChannels.setQuestAutoRegister,
      (event, options) =>
        run(
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

    yield* ipc.handle(EnvironmentIpcChannels.addItem, (event, name) =>
      run(
        applyEnvironmentMutation(event, (state) =>
          addEnvironmentItem(state, String(name ?? "")),
        ),
      ),
    );

    yield* ipc.handle(EnvironmentIpcChannels.removeItem, (event, name) =>
      run(
        applyEnvironmentMutation(event, (state) =>
          removeEnvironmentItem(state, String(name ?? "")),
        ),
      ),
    );

    yield* ipc.handle(EnvironmentIpcChannels.setItemRules, (event, rules) =>
      run(
        applyEnvironmentMutation(event, (state) =>
          setEnvironmentItemRules(
            state,
            isEnvironmentItemRules(rules) ? rules : state.itemRules,
          ),
        ),
      ),
    );

    yield* ipc.handle(EnvironmentIpcChannels.clearItems, (event) =>
      run(applyEnvironmentMutation(event, clearEnvironmentItems)),
    );

    yield* ipc.handle(EnvironmentIpcChannels.addBoost, (event, name) =>
      run(
        applyEnvironmentMutation(event, (state) =>
          addEnvironmentBoost(state, String(name ?? "")),
        ),
      ),
    );

    yield* ipc.handle(EnvironmentIpcChannels.removeBoost, (event, name) =>
      run(
        applyEnvironmentMutation(event, (state) =>
          removeEnvironmentBoost(state, String(name ?? "")),
        ),
      ),
    );

    yield* ipc.handle(EnvironmentIpcChannels.clearBoosts, (event) =>
      run(applyEnvironmentMutation(event, clearEnvironmentBoosts)),
    );

    yield* ipc.handle(EnvironmentIpcChannels.fetchBoosts, (event) =>
      run(
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

    yield* ipc.handle(EnvironmentIpcChannels.syncToAll, (event) =>
      run(
        Effect.gen(function* () {
          const sourceGameWindowId = yield* senderGameWindowId(event);
          const senderWindowId = getSenderWindowId(event);
          const state = getWindowState(sourceGameWindowId);
          const windows = yield* WindowService;
          const gameWindowIds = yield* windows.getGameWindowIds();

          for (const gameWindowId of gameWindowIds) {
            setWindowState(gameWindowId, state);
            yield* notifyEnvironmentChanged(
              gameWindowId,
              senderWindowId,
              state,
            );
          }

          return state;
        }),
      ),
    );
  });

const isString = (value: unknown): value is string => typeof value === "string";

const toQuestToken = (value: unknown): number | string =>
  typeof value === "number" || typeof value === "string" ? value : "";

const toOptionalQuestToken = (value: unknown): number | string | undefined =>
  typeof value === "number" || typeof value === "string" ? value : undefined;
