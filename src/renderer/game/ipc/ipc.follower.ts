import { Mutex } from 'async-mutex';
import interval from 'interval-promise';
import merge from 'lodash.merge';
import { WINDOW_IDS } from '../../../common/constants';
import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Logger } from '../../../common/logger';
import { Bot } from '../lib/Bot';
// import type { SetIntervalAsyncTimer } from '../lib/util/TimerManager';
import { doPriorityAttack } from '../util/doPriorityAttack';

let on = false;

// let intervalId: SetIntervalAsyncTimer | null = null;
let index = 0;
let attempts = 3;

const config: Partial<FollowerConfig> = {};
const mutex = new Mutex();
const bot = Bot.getInstance();

const logger = Logger.get('IpcFollower');

function packetHandler(packet: string) {
  if (!on) return;

  // if (!intervalId) return;

  const args = packet.split('%');
  const cmd = args[2];

  if (packet.startsWith('%') && cmd === 'uotls') {
    try {
      const plyr = args[4]!.toLowerCase();
      if (config?.name && plyr === config.name && config?.copyWalk) {
        const data = args[5]!.split(',');

        const spd = data.find((pkt) => pkt.startsWith('sp:'));
        const xPos = data.find((pkt) => pkt.startsWith('tx:'));
        const yPos = data.find((pkt) => pkt.startsWith('ty:'));

        const x = Number.parseInt(xPos!.split(':')[1]!, 10) ?? 0;
        const y = Number.parseInt(yPos!.split(':')[1]!, 10) ?? 0;
        const speed = Number.parseInt(spd!.split(':')[1]!, 10) ?? 8;

        bot.player.walkTo(x, y, speed);
      }
    } catch {}
  }
}

async function startFollower() {
  const cfg = config as FollowerConfig;
  const { name } = cfg;

  const foundPlayer = () =>
    bot.world.isPlayerInMap(name) &&
    bot.world.isPlayerInCell(name, bot.player.cell);

  // goto player if needed
  const goToPlayer = async () => {
    try {
      if (foundPlayer()) {
        return;
      }

      logger.info(`not found: ${name}`);

      const ogProvokeMap = bot.settings.provokeMap;
      const ogProvokeCell = bot.settings.provokeCell;

      bot.settings.provokeMap = false;
      bot.settings.provokeCell = false;

      if (bot.player.isInCombat()) {
        logger.info('in combat, trying to exit');

        // immediately try to escape with current cell
        await bot.world.jump(bot.player.cell, bot.player.pad);
        await bot.sleep(1_000);

        // if we are still in combat, try to escape to another cell
        if (bot.player.isInCombat()) {
          let escaped = false;

          const ogCell = bot.player.cell;

          for (const cell of bot.world.cells) {
            if (cell === ogCell) continue;

            // logger.info(`escape to: ${cell}`);
            await bot.world.jump(cell);

            await bot.waitUntil(() => !bot.player.isInCombat(), null, 3);

            if (!bot.player.isInCombat()) {
              logger.info(`success: ${cell}`);
              escaped = true;
              break;
            }
          }

          // we ran through all cells and are still in combat?
          // realistically this would never happen
          if (!escaped) return;
        }
      }

      if (attempts > 0) {
        logger.info(`goto player: ${name} [${attempts}]`);
        attempts--;
        bot.world.goto(name);
        await bot.sleep(1_000);
      }

      // wait
      await bot.waitUntil(
        () => !bot.world.isLoading() || foundPlayer(),
        null,
        3,
      );

      // we still haven't found them
      if (attempts === 0 && !foundPlayer()) {
        logger.info(`failed to find: ${name}`);
        await stopFollower();
        return;
      } else if (foundPlayer()) {
        attempts = 3;
        logger.info(`found: ${name}`);
      }

      // eslint-disable-next-line require-atomic-updates
      bot.settings.provokeMap = ogProvokeMap;
      // eslint-disable-next-line require-atomic-updates
      bot.settings.provokeCell = ogProvokeCell;
    } catch {}
  };

  bot.on('packetFromServer', packetHandler);

  // intervalId = bot.timerManager.setInterval(async () => {
  await interval(async (_, stop) => {
    if (!on) {
      stop();
      return;
    }

    if (!bot.player.isReady()) return;

    try {
      await mutex.acquire();

      if (bot.world.isPlayerInMap(name)) {
        if (bot.world.isPlayerInCell(name, bot.player.cell)) {
          bot.world.setSpawnPoint();

          if (Array.isArray(cfg.attackPriority)) {
            doPriorityAttack(cfg.attackPriority);
          }

          if (
            bot.world.isMonsterAvailable('*') &&
            bot.flash.get('world.myAvatar.target.npcType', true) !== 'monster'
          ) {
            bot.combat.attack('*');
          }

          if (bot.combat.hasTarget()) {
            await bot.combat.useSkill(
              cfg.skillList[index]!,
              false,
              cfg.skillWait,
            );
            index = (index + 1) % cfg.skillList!.length;
            await bot.sleep(cfg.skillDelay);
          }
        } else {
          logger.info('player is in map, but not in cell');
          bot.world.goto(name);
          await bot.sleep(500);
        }
      } else {
        await goToPlayer();
      }
    } finally {
      mutex.release();
    }
  }, 500);
}

async function stopFollower() {
  logger.info('stopping follower');

  if (mutex.isLocked()) {
    mutex.release();
  }

  on = false;
  // if (!intervalId) return;

  // const tmp = intervalId;
  // await bot.timerManager.clearInterval(tmp);
  // if (tmp === intervalId) {
  //   intervalId = null;
  // }

  index = 0;
  attempts = 3;

  bot.off('packetFromServer', packetHandler);
  await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
    ipcEvent: IPC_EVENTS.FOLLOWER_STOP,
    windowId: WINDOW_IDS.FOLLOWER,
  });
}

ipcRenderer.answerMain(IPC_EVENTS.FOLLOWER_ME, () => {
  if (!bot.player.isReady()) return null;

  return {
    name: bot.auth.username,
  };
});

ipcRenderer.answerMain(IPC_EVENTS.FOLLOWER_START, async (args) => {
  try {
    logger.info('starting follower', args);

    const {
      name: og_name,
      skillList: og_skillList,
      skillWait: og_skillWait,
      skillDelay: og_skillDelay,
      copyWalk: og_copyWalk,
      attackPriority: og_attackPriority,
    } = args;

    const name = (og_name === '' ? bot.auth.username : og_name).toLowerCase();
    const skillList = og_skillList.split(',').map((x) => x.trim()) ?? [
      1, 2, 3, 4,
    ];
    const skillWait = og_skillWait ?? false;
    const skillDelay = Number.parseInt(og_skillDelay, 10) ?? 150;
    const copyWalk = og_copyWalk ?? false;
    const attackPriority = [];

    if (og_attackPriority !== '') {
      const prio = og_attackPriority.split(',').map((tgt) => tgt.trim());
      attackPriority.push(...prio);
    }

    merge(config, {
      attackPriority,
      copyWalk,
      name,
      skillList,
      skillWait,
      skillDelay,
    });

    on = true;

    await bot.waitUntil(() => bot.player.isReady(), null, -1);
    await startFollower();
  } catch (error) {
    logger.error('follower start error', error);
  }
});

ipcRenderer.answerMain(IPC_EVENTS.FOLLOWER_STOP, async () => {
  logger.info('stopping follower');
  await stopFollower();
});

type FollowerConfig = {
  attackPriority: string[];
  copyWalk: boolean;
  name: string;
  skillDelay: number;
  skillList: string[];
  skillWait: boolean;
};
