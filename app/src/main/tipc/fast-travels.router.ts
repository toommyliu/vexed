import type { TipcInstance } from "@vexed/tipc";
import { matchError } from "better-result";
import type { FastTravel, FastTravelRoomNumber } from "~/shared/types";
import { fastTravelsService } from "../services/fast-travels";
import { createLogger } from "../services/logger";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import { TipcResult } from "./result";

const logger = createLogger("tipc:fast-travels");

export function createFastTravelsTipcRouter(tipc: TipcInstance) {
  return {
    all: tipc.procedure.action(async () => {
      const result = await fastTravelsService.getAll();
      if (result.isErr()) {
        logger.error(result.error);
        return TipcResult.err(result.error.message);
      }

      return TipcResult.ok(result.value);
    }),

    add: tipc.procedure.input<FastTravel>().action(async ({ input }) => {
      const result = await fastTravelsService.add(input);
      return result.match<
        TipcResult<"FAILED" | "NAME_ALREADY_EXISTS" | "SUCCESS">
      >({
        ok: () => TipcResult.ok("SUCCESS"),
        err: (error) =>
          matchError(error, {
            FastTravelDuplicateNameError: () =>
              TipcResult.ok("NAME_ALREADY_EXISTS"),
            FastTravelFileError: (err) => {
              logger.error(err.message, err.cause);
              return TipcResult.err(err.message);
            },
          }),
      });
    }),

    update: tipc.procedure
      .input<{ fastTravel: FastTravel; originalName: string }>()
      .action(async ({ input }) => {
        const result = await fastTravelsService.update(
          input.originalName,
          input.fastTravel,
        );
        return result.match<
          TipcResult<"FAILED" | "NAME_ALREADY_EXISTS" | "NOT_FOUND" | "SUCCESS">
        >({
          ok: () => TipcResult.ok("SUCCESS"),
          err: (error) =>
            matchError(error, {
              FastTravelDuplicateNameError: () =>
                TipcResult.ok("NAME_ALREADY_EXISTS"),
              FastTravelFileError: (err) => {
                logger.error(err.message, err.cause);
                return TipcResult.err(err.message);
              },
              FastTravelNotFoundError: () => TipcResult.ok("NOT_FOUND"),
            }),
        });
      }),

    remove: tipc.procedure
      .input<{ name: string }>()
      .action(async ({ input }) => {
        const result = await fastTravelsService.remove(input.name);
        return result.match<TipcResult<boolean>>({
          ok: () => TipcResult.ok(true),
          err: (error) => {
            matchError(error, {
              FastTravelFileError: (err) =>
                logger.error(err.message, err.cause),
              FastTravelNotFoundError: (err) => logger.warn(err.message),
            });
            return TipcResult.ok(false);
          },
        });
      }),

    warp: tipc.procedure
      .input<{ location: FastTravelRoomNumber }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const parent = windowsService.resolveGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        const childHandlers = context.getRendererHandlers<RendererHandlers>();

        await parentHandlers.fastTravels.warp.invoke({
          location: input.location,
        });
        childHandlers.fastTravels.enable.send();
      }),
  };
}
