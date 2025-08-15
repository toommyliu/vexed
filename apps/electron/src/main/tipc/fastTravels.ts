import { readJson } from "@vexed/fs-utils";
import { Logger } from "@vexed/logger";
import type { tipc } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { BrowserWindow } from "electron";
import {
  FAST_TRAVELS_PATH,
  DEFAULT_FAST_TRAVELS,
} from "../../shared/constants";
import type { FastTravel, FastTravelRoomNumber } from "../../shared/types";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

const logger = Logger.get("IpcMain");

type TipcInstance = ReturnType<typeof tipc.create>;

export function createFastTravelsTipcRouter(tipcInstance: TipcInstance) {
  return {
    getFastTravels: tipcInstance.procedure.action(async () => {
      try {
        return await readJson<FastTravel[]>(FAST_TRAVELS_PATH);
      } catch (error) {
        logger.error("Failed to read fast travels", error);
        return DEFAULT_FAST_TRAVELS;
      }
    }),
    doFastTravel: tipcInstance.procedure
      .input<{ location: FastTravelRoomNumber }>()
      .action(async ({ input, context }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const parent = browserWindow.getParentWindow();
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers = getRendererHandlers<RendererHandlers>(
          parent.webContents,
        );
        const childHandlers = getRendererHandlers<RendererHandlers>(
          context.sender,
        );

        await parentHandlers.fastTravels.doFastTravel.invoke({
          location: input.location,
        });
        childHandlers.fastTravels.fastTravelEnable.send();
      }),
  };
}
