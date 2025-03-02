import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Bot } from '../lib/Bot';
import { Logger } from '../util/logger';

const bot = Bot.getInstance();
const logger = Logger.get('IpcFastTravels');

ipcRenderer.answerMain(IPC_EVENTS.FAST_TRAVEL, async (args) => {
  logger.info(args);

  if (bot.player.isReady() && args?.map) {
    await bot.world
      .join(`${args.map}-${args.roomNumber}`, args?.cell, args?.pad)
      .catch(() => {});
  }
});
