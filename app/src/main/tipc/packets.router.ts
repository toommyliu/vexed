import type { TipcInstance } from "@vexed/tipc";
import { WindowIds } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import { withParentGameHandlers } from "./forwarding";

export function createPacketTipcRouter(tipc: TipcInstance) {
  return {
    startLogger: tipc.procedure.action(async ({ context }) => {
      await withParentGameHandlers(context, (parentHandlers) =>
        parentHandlers.packets.startLogger.send(),
      );
    }),
    stopLogger: tipc.procedure.action(async ({ context }) => {
      await withParentGameHandlers(context, (parentHandlers) =>
        parentHandlers.packets.stopLogger.send(),
      );
    }),
    onPacket: tipc.procedure
      .input<{ packet: string; type: string }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        const gameWindowId = windowsService.getGameWindowId(
          context.senderWindowId,
        );
        if (!gameWindowId) return;
        const packetLoggerWindow = windowsService.getSubwindow(
          gameWindowId,
          WindowIds.PacketLogger,
        );
        if (!packetLoggerWindow) return;
        const rendererHandler =
          context.getRendererHandlers<RendererHandlers>(packetLoggerWindow);
        rendererHandler.packets.onPacket.send(input);
      }),

    startSpammer: tipc.procedure
      .input<{
        delay: number;
        packets: string[];
      }>()
      .action(async ({ input, context }) => {
        await withParentGameHandlers(context, (parentHandlers) =>
          parentHandlers.packets.startSpammer.send(input),
        );
      }),
    stopSpammer: tipc.procedure.action(async ({ context }) => {
      await withParentGameHandlers(context, (parentHandlers) =>
        parentHandlers.packets.stopSpammer.send(),
      );
    }),
  };
}
