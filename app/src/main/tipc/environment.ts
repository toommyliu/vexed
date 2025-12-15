import type { TipcInstance } from "@vexed/tipc";
import type {
  EnvironmentState,
  EnvironmentUpdatePayload,
} from "../../shared/types";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

const EMPTY_STATE: EnvironmentState = {
  autoRegisterRequirements: false,
  autoRegisterRewards: false,
  boosts: [],
  itemNames: [],
  questIds: [],
  rejectElse: false,
};


// game window id -> environment state
const stateMap = new Map<number, EnvironmentState>();

function getWindowState(windowId: number): EnvironmentState {
  let windowState = stateMap.get(windowId);
  if (!windowState) {
    windowState = { ...EMPTY_STATE };
    stateMap.set(windowId, windowState);
  }
  return windowState;
}

export function cleanupEnvironmentState(windowId: number): void {
  stateMap.delete(windowId);
}

function applyUpdate(
  windowId: number,
  payload: EnvironmentUpdatePayload,
): EnvironmentState {
  const currentState = getWindowState(windowId);

  const normalizedQuestIds = payload.questIds
    .map(Number)
    .filter((id) => id !== -1)
    .sort((a, b) => a - b);

  const normalizedItemNames = payload.itemNames
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const normalizedBoosts = (payload.boosts ?? [])
    .map((boost) => boost.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const newState: EnvironmentState = {
    questIds: normalizedQuestIds,
    itemNames: normalizedItemNames,
    boosts: normalizedBoosts,
    rejectElse: payload.rejectElse ?? currentState.rejectElse,
    autoRegisterRequirements:
      payload.autoRegisterRequirements ?? currentState.autoRegisterRequirements,
    autoRegisterRewards:
      payload.autoRegisterRewards ?? currentState.autoRegisterRewards,
  };

  stateMap.set(windowId, newState);
  return newState;
}

export function createEnvironmentTipcRouter(tipcInstance: TipcInstance) {
  return {
    getState: tipcInstance.procedure.action(async ({ context }) => {
      const windowId =
        context.senderParentWindow?.id ?? context.senderWindow?.id;
      if (!windowId) return { ...EMPTY_STATE };
      return getWindowState(windowId);
    }),
    updateState: tipcInstance.procedure
      .input<EnvironmentUpdatePayload>()
      .action(async ({ context, input }) => {
        const browserWindow = context.senderWindow;
        const parent = context.senderParentWindow;
        const windowId = parent?.id ?? browserWindow?.id;

        if (!windowId) return;

        const newState = applyUpdate(windowId, input);

        // Notify the environment window (from game window)
        if (browserWindow && !windowStore.has(browserWindow.id)) {
          const rendererHandlers =
            context.getRendererHandlers<RendererHandlers>(browserWindow);
          rendererHandlers.environment.stateChanged.send(newState);
        }

        // Notify the game window (from environment window)
        if (parent && !parent.isDestroyed()) {
          const parentHandlers =
            context.getRendererHandlers<RendererHandlers>(parent);
          parentHandlers.environment.stateChanged.send(newState);
        }
      }),
    grabBoosts: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (parent && !parent.isDestroyed()) {
        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        return parentHandlers.environment.grabBoosts.invoke();
      }

      return [];
    }),
    stateChanged: tipcInstance.procedure
      .input<EnvironmentState>()
      .action(async ({ context, input }) => {
        if (!context?.senderWindow) return;

        const storeRef = windowStore.get(context?.senderWindow?.id);
        const environmentWindow = storeRef?.app.environment;
        if (
          !environmentWindow ||
          environmentWindow.isDestroyed() ||
          environmentWindow.webContents.isDestroyed()
        ) {
          return;
        }

        const rendererHandlers =
          context.getRendererHandlers<RendererHandlers>(environmentWindow);
        rendererHandlers.environment.stateChanged.send(input);
      }),
  };
}
