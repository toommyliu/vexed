import type { TipcInstance } from "@vexed/tipc";
import type {
  EnvironmentState,
  EnvironmentUpdatePayload,
} from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

const EMPTY_STATE: EnvironmentState = {
  autoRegisterRequirements: false,
  autoRegisterRewards: false,
  boosts: [],
  itemNames: [],
  questIds: [],
  questItemIds: {},
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

  // Filter questItemIds to only include valid quest IDs
  const questIdSet = new Set(normalizedQuestIds);
  const normalizedQuestItemIds: Record<number, number> = {};
  if (payload.questItemIds) {
    for (const [questIdStr, itemId] of Object.entries(payload.questItemIds)) {
      const questId = Number(questIdStr);
      if (questIdSet.has(questId)) {
        normalizedQuestItemIds[questId] = itemId;
      }
    }
  }

  const newState: EnvironmentState = {
    autoRegisterRequirements:
      payload.autoRegisterRequirements ?? currentState.autoRegisterRequirements,
    autoRegisterRewards:
      payload.autoRegisterRewards ?? currentState.autoRegisterRewards,
    boosts: normalizedBoosts,
    itemNames: normalizedItemNames,
    questIds: normalizedQuestIds,
    questItemIds: normalizedQuestItemIds,
    rejectElse: payload.rejectElse ?? currentState.rejectElse,
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
        const isFromGameWindow =
          browserWindow &&
          windowsService.getWindowStore().has(browserWindow.id);

        if (isFromGameWindow) {
          // Game window sent update → notify environment window if open
          const storeRef = windowsService
            .getWindowStore()
            .get(browserWindow.id);
          const envWindow = storeRef?.app.environment;
          if (
            envWindow &&
            !envWindow.isDestroyed() &&
            !envWindow.webContents.isDestroyed()
          ) {
            const envHandlers =
              context.getRendererHandlers<RendererHandlers>(envWindow);
            envHandlers.environment.stateChanged.send(newState);
          }
        } else if (
          parent &&
          !parent.isDestroyed() &&
          !parent.webContents.isDestroyed()
        ) {
          // Environment window sent update → notify game window
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
        const senderWindow = context?.senderWindow;
        if (!senderWindow) return;

        const windowId = senderWindow.id;
        if (windowsService.getWindowStore().has(windowId)) {
          stateMap.set(windowId, input);
        }

        const storeRef = windowsService.getWindowStore().get(senderWindow.id);
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
    broadcastState: tipcInstance.procedure
      .input<EnvironmentState>()
      .action(async ({ context, input }) => {
        const senderWindow = context?.senderWindow;
        const senderParent = context?.senderParentWindow;
        const senderGameWindowId = senderParent?.id ?? senderWindow?.id;

        for (const [gameWindowId, storeRef] of windowsService
          .getWindowStore()
          .entries()) {
          if (gameWindowId === senderGameWindowId) continue;

          // Update stateMap for this window
          stateMap.set(gameWindowId, input);

          // Notify the game window
          const gameWindow = storeRef.game;
          if (
            gameWindow &&
            !gameWindow.isDestroyed() &&
            !gameWindow.webContents.isDestroyed()
          ) {
            const gameHandlers =
              context.getRendererHandlers<RendererHandlers>(gameWindow);
            gameHandlers.environment.stateChanged.send(input);
          }

          // Notify the environment window if open
          const envWindow = storeRef.app.environment;
          if (
            envWindow &&
            !envWindow.isDestroyed() &&
            !envWindow.webContents.isDestroyed()
          ) {
            const envHandlers =
              context.getRendererHandlers<RendererHandlers>(envWindow);
            envHandlers.environment.stateChanged.send(input);
          }
        }
      }),
  };
}
