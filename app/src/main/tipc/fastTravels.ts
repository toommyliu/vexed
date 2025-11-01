import { readJson } from "@vexed/fs-utils";
import type { TipcInstance } from "@vexed/tipc";
import {
  DEFAULT_FAST_TRAVELS,
  FAST_TRAVELS_PATH,
} from "../../shared/constants";
import type { FastTravel, FastTravelRoomNumber } from "../../shared/types";
import { logger } from "../constants";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

export function createFastTravelsTipcRouter(tipcInstance: TipcInstance) {
  return {
    getAll: tipcInstance.procedure.action(async () => {
      try {
        return await readJson<FastTravel[]>(FAST_TRAVELS_PATH);
      } catch (error) {
        logger.error("Failed to read fast travels.", error);
        return DEFAULT_FAST_TRAVELS;
      }
    }),
    doFastTravel: tipcInstance.procedure
      .input<{ location: FastTravelRoomNumber }>()
      .action(async ({ input, context }) => {
        const parent = context.senderParentWindow;
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        const childHandlers = context.getRendererHandlers<RendererHandlers>();

        await parentHandlers.fastTravels.doFastTravel.invoke({
          location: input.location,
        });
        childHandlers.fastTravels.fastTravelEnable.send();
      }),
  };
}
