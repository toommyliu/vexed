export interface GameLoadState {
  readonly loaded: boolean;
  readonly progress?: number;
}

export type GameLoadStateListener = (state: GameLoadState) => void;
export type GameLoadedListener = () => void;

export interface GameLoadSubscriptionOptions {
  readonly emitCurrent?: boolean;
}

const readInitialState = (): GameLoadState => {
  const state = window.__vexedLoaderState;
  if (state?.progress === undefined) {
    return { loaded: state?.loaded ?? false };
  }

  return { loaded: state.loaded, progress: state.progress };
};

let currentState: GameLoadState = readInitialState();

const stateListeners = new Set<GameLoadStateListener>();
const loadedListeners = new Set<GameLoadedListener>();

const writeWindowState = () => {
  window.__vexedLoaderState = currentState;
};

const emitState = () => {
  for (const listener of stateListeners) {
    listener(currentState);
  }
};

export const getGameLoadState = (): GameLoadState => currentState;

export const setGameLoadProgress = (percent: number): void => {
  const progress = Math.min(Math.max(Math.round(percent), 0), 100);
  currentState = {
    loaded: currentState.loaded,
    progress,
  };
  writeWindowState();
  emitState();
};

export const markGameLoaded = (): void => {
  if (currentState.loaded && currentState.progress === 100) {
    return;
  }

  currentState = {
    loaded: true,
    progress: 100,
  };
  writeWindowState();
  emitState();

  for (const listener of loadedListeners) {
    listener();
  }
};

export const subscribeGameLoadState = (
  listener: GameLoadStateListener,
  options?: GameLoadSubscriptionOptions,
): (() => void) => {
  stateListeners.add(listener);

  if (options?.emitCurrent ?? true) {
    listener(currentState);
  }

  return () => {
    stateListeners.delete(listener);
  };
};

export const onGameLoaded = (
  listener: GameLoadedListener,
  options?: GameLoadSubscriptionOptions,
): (() => void) => {
  loadedListeners.add(listener);

  if ((options?.emitCurrent ?? true) && currentState.loaded) {
    listener();
  }

  return () => {
    loadedListeners.delete(listener);
  };
};
