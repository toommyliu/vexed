import { readJson, writeJson } from "@vexed/fs-utils";
import type { TipcInstance } from "@vexed/tipc";
import { equalsIgnoreCase } from "@vexed/utils/string";
import { Result } from "better-result";
import { DEFAULT_FAST_TRAVELS, FAST_TRAVELS_PATH } from "~/shared/constants";
import type { FastTravel, FastTravelRoomNumber } from "~/shared/types";
import { createLogger } from "../services/logger";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import { TipcResult } from "./result";

const logger = createLogger("tipc:fast-travels");

export function createFastTravelsTipcRouter(tipcInstance: TipcInstance) {
  return {
    getAll: tipcInstance.procedure.action(async () => {
      const result = await Result.tryPromise(async () =>
        readJson<FastTravel[]>(FAST_TRAVELS_PATH),
      );
      if (result.isErr()) {
        logger.error("Failed to read fast travels", result.error);
        return TipcResult.err("");
      }

      return TipcResult.ok(result.value);
    }),
    addFastTravel: tipcInstance.procedure
      .input<FastTravel>()
      .action(async ({ input }) => {
        try {
          const fastTravels = (await readJson<FastTravel[]>(
            FAST_TRAVELS_PATH,
          )) ?? [...DEFAULT_FAST_TRAVELS];

          const idx = fastTravels.findIndex((ft) =>
            equalsIgnoreCase(ft.name, input.name),
          );
          if (idx !== -1) return { msg: "NAME_ALREADY_EXISTS" } as const;

          fastTravels.push(input);
          await writeJson(FAST_TRAVELS_PATH, fastTravels);
          return { msg: "SUCCESS" } as const;
        } catch (error) {
          logger.error(
            "main",
            "Failed to add fast travel.",
            error instanceof Error ? error.message : error,
          );
          return { msg: "FAILED" } as const;
        }
      }),
    updateFastTravel: tipcInstance.procedure
      .input<{ fastTravel: FastTravel; originalName: string }>()
      .action(async ({ input }) => {
        try {
          const fastTravels = (await readJson<FastTravel[]>(
            FAST_TRAVELS_PATH,
          )) ?? [...DEFAULT_FAST_TRAVELS];

          const idx = fastTravels.findIndex((ft) =>
            equalsIgnoreCase(ft.name, input.originalName),
          );
          if (idx === -1) return { msg: "NOT_FOUND" } as const;

          if (!equalsIgnoreCase(input.fastTravel.name, input.originalName)) {
            const existingIdx = fastTravels.findIndex((ft) =>
              equalsIgnoreCase(ft.name, input.fastTravel.name),
            );
            if (existingIdx !== -1)
              return { msg: "NAME_ALREADY_EXISTS" } as const;
          }

          fastTravels[idx] = input.fastTravel;
          await writeJson(FAST_TRAVELS_PATH, fastTravels);
          return { msg: "SUCCESS" } as const;
        } catch (error) {
          logger.error(
            "main",
            "Failed to update fast travel.",
            error instanceof Error ? error.message : error,
          );
          return { msg: "FAILED" } as const;
        }
      }),
    removeFastTravel: tipcInstance.procedure
      .input<{ name: string }>()
      .action(async ({ input }) => {
        try {
          const fastTravels = (await readJson<FastTravel[]>(
            FAST_TRAVELS_PATH,
          )) ?? [...DEFAULT_FAST_TRAVELS];

          const idx = fastTravels.findIndex((ft) =>
            equalsIgnoreCase(ft.name, input.name),
          );
          if (idx === -1) return false;

          fastTravels.splice(idx, 1);
          await writeJson(FAST_TRAVELS_PATH, fastTravels);
          return true;
        } catch (error) {
          logger.error(
            "main",
            "Failed to remove fast travel.",
            error instanceof Error ? error.message : error,
          );
          return false;
        }
      }),
    doFastTravel: tipcInstance.procedure
      .input<{ location: FastTravelRoomNumber }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const parent = windowsService.resolveGameWindow(senderWindow.id);
        if (!parent) return;

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
