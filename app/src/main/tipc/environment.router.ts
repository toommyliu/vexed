import type { TipcInstance } from "@vexed/tipc";
import {
  createEmptyEnvironmentState,
  diffEnvironmentState,
  normalizeEnvironmentState,
} from "~/shared/environment/helpers";
import type {
  EnvironmentState,
  EnvironmentUpdatePayload,
} from "~/shared/environment/types";
import { WindowIds } from "~/shared/types";
import { environmentService } from "../services/environment";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import {
  isWindowUsable,
  withParentGameHandlers,
  withSubwindowHandlers,
} from "./forwarding";

export function createEnvironmentTipcRouter(tipcInstance: TipcInstance) {
  return {
    getState: tipcInstance.procedure.action(async ({ context }) => {
      const result = environmentService.getStateForSender(
        context.senderWindow?.id,
      );
      if (result.isErr())
        return normalizeEnvironmentState(createEmptyEnvironmentState());
      return result.value;
    }),
    updateState: tipcInstance.procedure
      .input<EnvironmentUpdatePayload>()
      .requireSenderWindow()
      .action(async ({ context, input }) => {
        const beforeResult = environmentService.getStateForSender(
          context.senderWindowId,
        );
        const beforeState = beforeResult.isOk()
          ? beforeResult.value
          : createEmptyEnvironmentState();
        const result = environmentService.applyUpdateForSender(
          context.senderWindowId,
          input,
        );
        if (result.isErr()) return;
        const newState = result.value;
        const diffs = diffEnvironmentState(beforeState, newState);
        if (diffs.length > 0) {
          console.info("[env:updateState]", {
            senderWindowId: context.senderWindowId,
            diffs: require("util").inspect(diffs, { depth: null }),
          });
        }

        if (windowsService.isGameWindow(context.senderWindowId)) {
          await withSubwindowHandlers(
            context,
            WindowIds.Environment,
            (envHandlers) =>
              envHandlers.environment.stateChanged.send(newState),
          );
          return;
        }

        await withParentGameHandlers(context, (parentHandlers) =>
          parentHandlers.environment.stateChanged.send(newState),
        );
      }),

    stateChanged: tipcInstance.procedure
      .input<EnvironmentState>()
      .requireSenderWindow()
      .action(async ({ context, input }) => {
        const beforeResult = environmentService.getStateForSender(
          context.senderWindowId,
        );
        const beforeState = beforeResult.isOk()
          ? beforeResult.value
          : createEmptyEnvironmentState();
        const normalized = normalizeEnvironmentState(input);
        const diffs = diffEnvironmentState(beforeState, normalized);
        if (diffs.length > 0) {
          console.info("[env:stateChanged]", {
            senderWindowId: context.senderWindowId,
            diffs,
          });
        }

        if (windowsService.isGameWindow(context.senderWindowId)) {
          environmentService.setStateForGameWindow(
            context.senderWindowId,
            normalized,
          );
        }

        await withSubwindowHandlers(
          context,
          WindowIds.Environment,
          (rendererHandlers) =>
            rendererHandlers.environment.stateChanged.send(normalized),
        );
      }),

    broadcastState: tipcInstance.procedure
      .input<EnvironmentState>()
      .requireSenderWindow()
      .action(async ({ context, input }) => {
        const senderGameWindowId = windowsService.getGameWindowId(
          context.senderWindow.id,
        );
        const normalized = normalizeEnvironmentState(input);
        void windowsService.forEachGameWindow((gameWindowId, gameWindow) => {
          if (gameWindowId === senderGameWindowId) return;

          // Update stateMap for this window
          const beforeState =
            environmentService.getStateForGameWindow(gameWindowId);
          const diffs = diffEnvironmentState(beforeState, normalized);
          if (diffs.length > 0) {
            console.info("[env:broadcastState]", {
              senderWindowId: context.senderWindowId,
              gameWindowId,
              diffs,
            });
          }

          environmentService.setStateForGameWindow(gameWindowId, normalized);

          // Notify the game window
          if (isWindowUsable(gameWindow)) {
            const gameHandlers =
              context.getRendererHandlers<RendererHandlers>(gameWindow);
            gameHandlers.environment.stateChanged.send(normalized);
          }

          // Notify the environment window
          const envWindow = windowsService.getSubwindow(
            gameWindowId,
            WindowIds.Environment,
          );
          if (isWindowUsable(envWindow)) {
            const envHandlers =
              context.getRendererHandlers<RendererHandlers>(envWindow);
            envHandlers.environment.stateChanged.send(normalized);
          }
        });
      }),

    grabBoosts: tipcInstance.procedure.action(async ({ context }) => {
      const result = await withParentGameHandlers(
        context,
        async (parentHandlers) =>
          parentHandlers.environment.grabBoosts.invoke(),
      );
      return result ?? [];
    }),
  };
}
