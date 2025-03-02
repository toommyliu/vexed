import { WINDOW_IDS } from '../../../common/constants';
import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Logger } from '../../../common/logger';
import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();
const logger = Logger.get('IpcLogger');

let on = false;
let hasListener = false;

const fn = async (packet: string) => {
  if (!on) return;

  await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
    ipcEvent: IPC_EVENTS.PACKET_LOGGER_PACKET,
    data: { packet },
    windowId: WINDOW_IDS.PACKETS_LOGGER,
  });
};

ipcRenderer.answerMain(IPC_EVENTS.PACKET_LOGGER_START, async () => {
  logger.info('start packet logger');

  on = true;

  if (hasListener) return;

  hasListener = true;
  bot.on('packetFromClient', fn);
});

ipcRenderer.answerMain(IPC_EVENTS.PACKET_LOGGER_STOP, async () => {
  logger.info('stop packet logger');
  on = false;
});
