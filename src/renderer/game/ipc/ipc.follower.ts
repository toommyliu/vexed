import { Mutex } from 'async-mutex';
import { WINDOW_IDS } from '../../../common/constants';
import { interval } from '../../../common/interval';
import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Logger } from '../../../common/logger';
import { Bot } from '../lib/Bot';
import { doPriorityAttack } from '../util/doPriorityAttack';
import { startDropsTimer, stopDropsTimer } from '../util/dropTimer';
import { exitFromCombat } from '../util/exitFromCombat';
import { startQuestTimer, stopQuestTimer } from '../util/questTimer';

let on = false;

let index = 0;
let safeIndex = 0;
let attempts = 3;

let config: Partial<FollowerConfig> = {};

const mutex = new Mutex();
const bot = Bot.getInstance();

const logger = Logger.get('IpcFollower');

function parseConfig(rawConfig: FollowerConfigRaw): FollowerConfig {
  const {
    name: rawName,
    skillList: rawSkillList,
    skillWait: rawSkillWait,
    skillDelay: rawSkillDelay,
    copyWalk: rawCopyWalk,
    attackPriority: rawAttackPriority,
    antiCounter: rawAntiCounter,
    safeSkillEnabled: rawSafeSkillEnabled,
    safeSkill: rawSafeSkill,
    safeSkillHp: rawSafeSkillHp,
  } = rawConfig;

  const name = (
    rawName === '' ? (bot.auth?.username ?? '') : rawName
  ).toLowerCase();

  const skillList =
    typeof rawSkillList === 'string' && rawSkillList.trim() !== ''
      ? rawSkillList.split(',').map((x) => x.trim())
      : ['1', '2', '3', '4'];

  const skillWait = Boolean(rawSkillWait);
  const copyWalk = Boolean(rawCopyWalk);
  const antiCounter = Boolean(rawAntiCounter);
  const safeSkillEnabled = Boolean(rawSafeSkillEnabled);

  const skillDelay = Number.parseInt(rawSkillDelay, 10) ?? 150;
  const safeSkillHp = Number.parseInt(rawSafeSkillHp, 10);

  const attackPriority =
    typeof rawAttackPriority === 'string' && rawAttackPriority.trim() !== ''
      ? rawAttackPriority.split(',').map((tgt) => tgt.trim())
      : [];

  const safeSkill =
    typeof rawSafeSkill === 'string' && rawSafeSkill.trim() !== ''
      ? rawSafeSkill.split(',').map((x) => x.trim())
      : [];

  // can be csv AND new line
  const quests =
    typeof rawConfig.quests === 'string' && rawConfig.quests.trim() !== ''
      ? rawConfig.quests
          .split(/[\n,]/)
          .map((quest) => quest.trim())
          .filter(Boolean)
      : [];
  const drops =
    typeof rawConfig.drops === 'string' && rawConfig.drops.trim() !== ''
      ? rawConfig.drops
          .split(/[\n,]/)
          .map((drop) => drop.trim())
          .filter(Boolean)
      : [];

  const ret = {
    name,
    skillList,
    skillWait,
    skillDelay,
    copyWalk,
    attackPriority,
    antiCounter,
    safeSkillEnabled,
    safeSkill,
    safeSkillHp,
    quests,
    drops,
  };

  console.log('parsed config', ret);

  return ret;
}

type UotlPacket = {
  params: {
    dataObj: string[];
    type: string;
  };
};
function packetHandler(packet: UotlPacket) {
  if (!on) return;

  if (packet?.params?.type !== 'str' || !config?.name) return;

  const args = packet.params.dataObj;
  if (!args?.length) return;

  if (
    config?.copyWalk &&
    args[0] === 'uotls' &&
    args[2]?.toLowerCase() === config.name &&
    args[3]?.includes('sp:') &&
    args[3]?.includes('tx:') &&
    args[3]?.includes('ty:')
  ) {
    const data = args[3]!.split(',');

    const spd = data.find((pkt) => pkt.startsWith('sp:'));
    const xPos = data.find((pkt) => pkt.startsWith('tx:'));
    const yPos = data.find((pkt) => pkt.startsWith('ty:'));
    const x = Number.parseInt(xPos!.split(':')[1]!, 10) ?? 0;
    const y = Number.parseInt(yPos!.split(':')[1]!, 10) ?? 0;
    const speed = Number.parseInt(spd!.split(':')[1]!, 10) ?? 8;

    bot.player.walkTo(x, y, speed);
  }
}

async function startFollower() {
  const cfg = config as FollowerConfig;
  const { name } = cfg;

  const foundPlayer = () => {
    if (!name) return true;

    return (
      bot.world.isPlayerInMap(name) &&
      bot.world.isPlayerInCell(name, bot.player.cell)
    );
  };

  // goto player if needed
  async function goToPlayer() {
    if (foundPlayer()) {
      attempts = 3;
      return;
    }

    logger.info(`not found: ${name}`);

    const ogProvokeMap = bot.settings.provokeMap;
    const ogProvokeCell = bot.settings.provokeCell;

    bot.settings.provokeMap = false;
    bot.settings.provokeCell = false;

    /* const success = */ await exitFromCombat();

    // didn't exit
    // if (!success) {
    //   attempts--;
    //   logger.info(`failed to exit, ${attempts}/3`);

    //   if (attempts <= 0) {
    //     logger.info('max attempts, stopping');
    //     await stopFollower();
    //     return;
    //   }

    //   /* eslint-disable require-atomic-updates */
    //   bot.settings.provokeMap = ogProvokeMap;
    //   bot.settings.provokeCell = ogProvokeCell;
    //   /* eslint-enable require-atomic-updates */

    //   return;
    // }

    logger.info(`goto ${name}`);
    bot.world.goto(name);

    // wait
    await bot.waitUntil(() => bot.player.isReady() && foundPlayer(), null, 3);

    // found them
    if (foundPlayer()) {
      attempts = 3;
      logger.info(`found: ${name}`);
    } else {
      attempts--;

      logger.info(`player ${name} not found: ${attempts}/3`);

      if (attempts <= 0) {
        logger.info(`failed to find: ${name} after 3 attempts, stopping`);
        await stopFollower();
      }
    }

    /* eslint-disable require-atomic-updates */
    bot.settings.provokeMap = ogProvokeMap;
    bot.settings.provokeCell = ogProvokeCell;
    /* eslint-enable require-atomic-updates */
  }

  bot.on('pext', packetHandler);

  if (cfg.quests.length) {
    startQuestTimer(cfg.quests);
  }

  if (cfg.drops.length) {
    startDropsTimer(cfg.drops);
  }

  void interval(async (_, stop) => {
    if (!on) {
      stop();
      return;
    }

    if (!bot.player.isReady()) return;

    try {
      await mutex.acquire();

      if (bot.world.isPlayerInMap(name || bot.auth.username)) {
        if (
          bot.world.isPlayerInCell(name || bot.auth.username, bot.player.cell)
        ) {
          bot.world.setSpawnPoint();

          if (!bot.world.availableMonsters.length) {
            return;
          }

          if (cfg.safeSkillEnabled && cfg.safeSkill.length) {
            for (const playerName of bot.world.playerNames) {
              const player = bot.world.players?.get(playerName);
              if (player?.isHpPercentageLessThan(cfg.safeSkillHp)) {
                await bot.combat.useSkill(
                  cfg.safeSkill[safeIndex]!,
                  true,
                  false,
                );
                safeIndex = (safeIndex + 1) % cfg.safeSkill.length;
                await bot.sleep(cfg.skillDelay);
              }
            }
          }

          doPriorityAttack(cfg.attackPriority);

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
          await goToPlayer();
          // bot.world.goto(name);
          // await bot.sleep(500);
        }
      } else {
        logger.info('player not in map');
        await goToPlayer();
      }
    } finally {
      mutex.release();
    }
  }, 500);
}

async function stopFollower() {
  if (mutex.isLocked()) {
    mutex.release();
  }

  on = false;

  index = 0;
  safeIndex = 0;
  attempts = 3;

  stopQuestTimer();
  stopDropsTimer();

  bot.off('pext', packetHandler);
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

    config = parseConfig(args as unknown as FollowerConfigRaw);

    // Unbank items in the bank
    if (config.drops?.length) {
      await bot.bank.withdrawMultiple(config.drops);
    }

    if (config.antiCounter) {
      // eslint-disable-next-line require-atomic-updates
      bot.settings.counterAttack = true;
    }

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
  antiCounter: boolean;
  attackPriority: string[];
  copyWalk: boolean;
  drops: string[];
  name: string;
  quests: string[];
  safeSkill: string[];
  safeSkillEnabled: boolean;
  safeSkillHp: number;
  skillDelay: number;
  skillList: string[];
  skillWait: boolean;
};
type FollowerConfigRaw = {
  antiCounter: boolean;
  attackPriority: string;
  copyWalk: boolean;
  drops: string;
  name: string;
  quests: string;
  safeSkill: string;
  safeSkillEnabled: boolean;
  safeSkillHp: string;
  skillDelay: string;
  skillList: string;
  skillWait: boolean;
};
