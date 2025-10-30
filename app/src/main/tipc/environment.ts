import { getRendererHandlers, type TipcInstance } from "@vexed/tipc";
import { BrowserWindow } from "electron";
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

let state: EnvironmentState = { ...EMPTY_STATE };

function applyUpdate(payload: EnvironmentUpdatePayload): void {
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

  state = {
    questIds: normalizedQuestIds,
    itemNames: normalizedItemNames,
    boosts: normalizedBoosts,
    rejectElse: payload.rejectElse ?? state.rejectElse,
    autoRegisterRequirements: payload.autoRegisterRequirements ?? state.autoRegisterRequirements,
    autoRegisterRewards: payload.autoRegisterRewards ?? state.autoRegisterRewards,
  };
}

export function createEnvironmentTipcRouter(tipcInstance: TipcInstance) {
  return {
    getState: tipcInstance.procedure.action(async () => state),
    updateState: tipcInstance.procedure
      .input<EnvironmentUpdatePayload>()
      .action(async ({ context, input }) => {
        applyUpdate(input);

        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        const parent = browserWindow?.getParentWindow();

        // Broadcast stateChanged to all relevant windows
        // Environment window (if this is from game window)
        if (browserWindow && !windowStore.has(browserWindow.id)) {
          const rendererHandlers = getRendererHandlers<RendererHandlers>(
            browserWindow.webContents,
          );
          rendererHandlers.environment.stateChanged.send(state);
        }

        // Game window (if this is from environment window)
        if (parent && !parent.isDestroyed()) {
          const parentHandlers = getRendererHandlers<RendererHandlers>(
            parent.webContents,
          );
          parentHandlers.environment.stateChanged.send(state);
        }

        // Also broadcast to environment window if it exists (for completeness)
        const storeRef = windowStore.get(browserWindow?.id || parent?.id || 0);
        const environmentWindow = storeRef?.app.environment;
        if (
          environmentWindow &&
          !environmentWindow.isDestroyed() &&
          environmentWindow.webContents &&
          !environmentWindow.webContents.isDestroyed()
        ) {
          const envHandlers = getRendererHandlers<RendererHandlers>(
            environmentWindow.webContents,
          );
          envHandlers.environment.stateChanged.send(state);
        }
      }),
    grabBoosts: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      const parent = browserWindow?.getParentWindow();

      if (parent && !parent.isDestroyed()) {
        const parentHandlers = getRendererHandlers<RendererHandlers>(
          parent.webContents,
        );
        return parentHandlers.environment.grabBoosts.invoke();
      }

      return [];
    }),
    grabBoostsResponse: tipcInstance.procedure
      .input<{ boosts: string[] }>()
      .action(async ({ context, input }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const storeRef = windowStore.get(browserWindow.id);
        const environmentWindow = storeRef?.app.environment;
        if (
          !environmentWindow ||
          environmentWindow.isDestroyed() ||
          environmentWindow.webContents.isDestroyed()
        ) {
          return;
        }

        const rendererHandlers = getRendererHandlers<RendererHandlers>(
          environmentWindow.webContents,
        );
        rendererHandlers.environment.grabBoostsResponse.send(input);
      }),
    stateChanged: tipcInstance.procedure
      .input<EnvironmentState>()
      .action(async ({ context, input }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const storeRef = windowStore.get(browserWindow.id);
        const environmentWindow = storeRef?.app.environment;
        if (
          !environmentWindow ||
          environmentWindow.isDestroyed() ||
          environmentWindow.webContents.isDestroyed()
        ) {
          return;
        }

        const rendererHandlers = getRendererHandlers<RendererHandlers>(
          environmentWindow.webContents,
        );
        rendererHandlers.environment.stateChanged.send(input);
      }),
  };
}
