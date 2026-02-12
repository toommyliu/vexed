import type { TipcInstance } from "@vexed/tipc";
import { matchError } from "better-result";
import type { FastTravel, FastTravelRoomNumber } from "~/shared/types";
import { fastTravels } from "../services/fast-travels";
import { createLogger } from "../services/logger";
import type { RendererHandlers } from "../tipc";
import { getParentGameHandlers } from "./forwarding";
import { TipcResult } from "./result";

const logger = createLogger("tipc:fast-travels");

export function createFastTravelsTipcRouter(tipc: TipcInstance) {
  return {
    all: tipc.procedure.action(async () => {
      const result = await fastTravels.getAll();
      if (result.isErr()) {
        logger.error(result.error);
        return TipcResult.err(result.error.message);
      }

      return TipcResult.ok(result.value);
    }),

    add: tipc.procedure.input<FastTravel>().action(async ({ input }) => {
      const result = await fastTravels.add(input);
      return result.match<
        TipcResult<"FAILED" | "NAME_ALREADY_EXISTS" | "SUCCESS">
      >({
        ok: () => TipcResult.ok("SUCCESS"),
        err: (error) => {
          if (error._tag !== "FastTravelDuplicateNameError") {
            logger.error(error);
          }

          return matchError(error, {
            FastTravelDuplicateNameError: () =>
              TipcResult.ok("NAME_ALREADY_EXISTS"),
            FastTravelFileError: (err) => TipcResult.err(err.message),
            FsReadError: (err) => TipcResult.err(err.message),
            FsJsonParseError: (err) => TipcResult.err(err.message),
          });
        },
      });
    }),

    update: tipc.procedure
      .input<{ fastTravel: FastTravel; originalName: string }>()
      .action(async ({ input }) => {
        const result = await fastTravels.update(
          input.originalName,
          input.fastTravel,
        );
        return result.match<
          TipcResult<"FAILED" | "NAME_ALREADY_EXISTS" | "NOT_FOUND" | "SUCCESS">
        >({
          ok: () => TipcResult.ok("SUCCESS"),
          err: (error) => {
            if (
              error._tag !== "FastTravelDuplicateNameError" &&
              error._tag !== "FastTravelNotFoundError"
            ) {
              logger.error(error);
            }

            return matchError(error, {
              FastTravelDuplicateNameError: () =>
                TipcResult.ok("NAME_ALREADY_EXISTS"),
              FastTravelFileError: (err) => TipcResult.err(err.message),
              FsReadError: (err) => TipcResult.err(err.message),
              FsJsonParseError: (err) => TipcResult.err(err.message),
              FastTravelNotFoundError: () => TipcResult.ok("NOT_FOUND"),
            });
          },
        });
      }),

    remove: tipc.procedure
      .input<{ name: string }>()
      .action(async ({ input }) => {
        const result = await fastTravels.remove(input.name);
        return result.match<TipcResult<boolean>>({
          ok: () => TipcResult.ok(true),
          err: (error) => {
            if (error._tag === "FastTravelNotFoundError") {
              logger.warn(error.message);
            } else {
              logger.error(error);
            }

            return TipcResult.ok(false);
          },
        });
      }),

    warp: tipc.procedure
      .input<{ location: FastTravelRoomNumber }>()
      .action(async ({ input, context }) => {
        const parentHandlers = getParentGameHandlers(context);
        if (!parentHandlers) return;
        const childHandlers = context.getRendererHandlers<RendererHandlers>();

        await parentHandlers.fastTravels.warp.invoke({
          location: input.location,
        });
        childHandlers.fastTravels.enable.send();
      }),
  };
}
