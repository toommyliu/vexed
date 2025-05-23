import { WINDOW_IDS } from "../../../common/constants";
import { ipcRenderer } from "../../../common/ipc";
import { IPC_EVENTS } from "../../../common/ipc-events";
// import { Logger } from "../../../common/logger";
import { Bot } from "../lib/Bot";

const bot = Bot.getInstance();
// const logger = Logger.get("IpcLogger");

let on = false;
let hasListeners = false;

const fnClient = async (packet: string) => {
  if (!on) return;

  await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
    ipcEvent: IPC_EVENTS.PACKET_LOGGER_PACKET_CLIENT,
    data: { packet, type: "client" },
    windowId: WINDOW_IDS.PACKETS_LOGGER,
  });
};

const fnServer = async (packet: string) => {
  if (!on) return;

  await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
    ipcEvent: IPC_EVENTS.PACKET_LOGGER_PACKET_SERVER,
    data: { packet, type: "server" },
    windowId: WINDOW_IDS.PACKETS_LOGGER,
  });
};

const fnPext = async (packet: Record<string, unknown>) => {
  if (!on) return;

  await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
    ipcEvent: IPC_EVENTS.PACKET_LOGGER_PACKET_PEXT,
    data: { packet, type: "pext" },
    windowId: WINDOW_IDS.PACKETS_LOGGER,
  });
};

ipcRenderer.answerMain(IPC_EVENTS.PACKET_LOGGER_START, async () => {
  on = true;

  if (hasListeners) return;

  hasListeners = true;
  bot.on("packetFromClient", fnClient);
  bot.on("packetFromServer", fnServer);
  bot.on("pext", fnPext);
});

ipcRenderer.answerMain(IPC_EVENTS.PACKET_LOGGER_STOP, async () => {
  on = false;
});
