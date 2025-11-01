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
    autoRegisterRequirements:
      payload.autoRegisterRequirements ?? state.autoRegisterRequirements,
    autoRegisterRewards:
      payload.autoRegisterRewards ?? state.autoRegisterRewards,
  };
}

export function createEnvironmentTipcRouter(tipcInstance: TipcInstance) {
  return {
    getState: tipcInstance.procedure.action(async () => state),
    updateState: tipcInstance.procedure
      .input<EnvironmentUpdatePayload>()
      .action(async ({ context, input }) => {
        applyUpdate(input);

        const browserWindow = context.senderWindow;
        const parent = context.senderParentWindow;

        // To environment window, from game window
        if (browserWindow && !windowStore.has(browserWindow.id)) {
          const rendererHandlers =
            context.getRendererHandlers<RendererHandlers>(browserWindow);
          rendererHandlers.environment.stateChanged.send(state);
        }

        // To game window, from environment window
        if (parent && !parent.isDestroyed()) {
          const parentHandlers =
            context.getRendererHandlers<RendererHandlers>(parent);
          parentHandlers.environment.stateChanged.send(state);
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
