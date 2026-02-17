import type { TipcInstance } from "@vexed/tipc";
import { Result } from "better-result";
import type {
  FastTravel,
  FastTravelRoomNumber,
} from "~/shared/fast-travels/types";
import { fastTravels } from "../services/fast-travels";
import type { RendererHandlers } from "../tipc";
import { withParentGameHandlers } from "./forwarding";

export function createFastTravelsTipcRouter(tipc: TipcInstance) {
  return {
    all: tipc.procedure.action(async () => {
      const result = await fastTravels.getAll();
      return Result.serialize(result);
    }),

    add: tipc.procedure.input<FastTravel>().action(async ({ input }) => {
      const result = await fastTravels.add(input);
      return Result.serialize(result);
    }),

    update: tipc.procedure
      .input<{ fastTravel: FastTravel; originalName: string }>()
      .action(async ({ input }) => {
        const result = await fastTravels.update(
          input.originalName,
          input.fastTravel,
        );
        return Result.serialize(result);
      }),

    remove: tipc.procedure
      .input<{ name: string }>()
      .action(async ({ input }) => {
        const result = await fastTravels.remove(input.name);
        return Result.serialize(result);
      }),

    warp: tipc.procedure
      .input<{ location: FastTravelRoomNumber }>()
      .action(async ({ input, context }) => {
        await withParentGameHandlers(context, async (parentHandlers) => {
          await parentHandlers.fastTravels.warp.invoke({
            location: input.location,
          });
          const childHandlers = context.getRendererHandlers<RendererHandlers>();
          childHandlers.fastTravels.enable.send();
        });
      }),
  };
}
