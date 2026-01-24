import { Bot } from "~/lib/Bot";
import { client, handlers } from "~/shared/tipc";

let clientPacketListener: ((packet: string) => Promise<void>) | null = null;
let serverPacketListener: ((packet: string) => Promise<void>) | null = null;
let pextPacketListener:
  | ((packet: Record<string, unknown>) => Promise<void>)
  | null = null;

function cleanupListeners() {
  const bot = Bot.getInstance();

  if (clientPacketListener) bot.off("packetFromClient", clientPacketListener);
  if (serverPacketListener) bot.off("packetFromServer", serverPacketListener);
  if (pextPacketListener) bot.off("pext", pextPacketListener);

  clientPacketListener = null;
  serverPacketListener = null;
  pextPacketListener = null;
}

handlers.packetLogger.start.listen(() => {
  const bot = Bot.getInstance();

  cleanupListeners();

  clientPacketListener = async (packet) => {
    await client.packetLogger.packetLoggerPacket({
      type: "client",
      packet,
    });
  };

  serverPacketListener = async (packet) => {
    await client.packetLogger.packetLoggerPacket({
      type: "server",
      packet,
    });
  };

  pextPacketListener = async (packet) => {
    await client.packetLogger.packetLoggerPacket({
      type: "pext",
      packet: JSON.stringify(packet),
    });
  };

  bot.on("packetFromClient", clientPacketListener);
  bot.on("packetFromServer", serverPacketListener);
  bot.on("pext", pextPacketListener);
});

handlers.packetLogger.stop.listen(() => {
  cleanupListeners();
});
