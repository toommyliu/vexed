import { Mutex } from 'async-mutex';
import { interval } from '../../../common/interval';
import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Logger } from '../../../common/logger';
import { Bot } from '../lib/Bot';

const mutex = new Mutex();

let on = false;
let index = 0;

const bot = Bot.getInstance();
const logger = Logger.get('IpcSpammer');

ipcRenderer.answerMain(IPC_EVENTS.PACKET_SPAMMER_START, async (data) => {
  logger.info('start packet spammer', data);

  const { packets, delay } = data;
  on = true;

  await interval(
    async (_, stop) => {
      if (!on) {
        stop();
        return;
      }

      logger.info('tick');

      if (!bot.player.isReady()) return;

      await mutex.runExclusive(() => {
        logger.info(`sending packet: ${packets[index]}`);
        bot.packets.sendServer(packets[index]!);
        index = (index + 1) % packets.length;
      });
    },
    delay,
    { stopOnError: false },
  ).catch(() => {});
});

ipcRenderer.answerMain(IPC_EVENTS.PACKET_SPAMMER_STOP, async () => {
  logger.info('stop packet spammer');

  on = false;
  index = 0;
});
