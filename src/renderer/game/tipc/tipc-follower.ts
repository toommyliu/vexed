import { Mutex } from "async-mutex";
import { interval } from "../../../common/interval";
// import { Logger } from "../../../common/logger";
import { handlers } from "../../../shared/tipc";
import { Bot } from "../lib/Bot";
import { doPriorityAttack } from "../util/doPriorityAttack";
import {
  registerDrop,
  startDropsTimer,
  stopDropsTimer,
} from "../util/dropTimer";
import { exitFromCombat } from "../util/exitFromCombat";
import {
  registerQuest,
  startQuestTimer,
  stopQuestTimer,
} from "../util/questTimer";

let on = false;

let index = 0;
let safeIndex = 0;
let attempts = 3;

let config: FollowerConfig | null = null;

const mutex = new Mutex();
const bot = Bot.getInstance();

// const logger = Logger.get("IpcFollower");

function parseConfig(rawConfig: FollowerStartInput) {
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
    rejectElse: rawRejectElse,
  } = rawConfig;

  const name = (
    rawName === "" ? (bot.auth?.username ?? "") : rawName
  ).toLowerCase();

  const skillList =
    typeof rawSkillList === "string" && rawSkillList.trim() !== ""
      ? rawSkillList.split(",").map((x) => x.trim())
      : ["1", "2", "3", "4"];

  const skillWait = Boolean(rawSkillWait);
  const copyWalk = Boolean(rawCopyWalk);
  const antiCounter = Boolean(rawAntiCounter);
  const safeSkillEnabled = Boolean(rawSafeSkillEnabled);

  const skillDelay = Number.parseInt(rawSkillDelay, 10) ?? 150;
  const safeSkillHp = Number.parseInt(rawSafeSkillHp, 10);

  const attackPriority =
    typeof rawAttackPriority === "string" && rawAttackPriority.trim() !== ""
      ? rawAttackPriority.split(",").map((tgt) => tgt.trim())
      : [];

  const safeSkill =
    typeof rawSafeSkill === "string" && rawSafeSkill.trim() !== ""
      ? rawSafeSkill.split(",").map((x) => x.trim())
      : [];

  const quests =
    typeof rawConfig.quests === "string" && rawConfig.quests.trim() !== ""
      ? rawConfig.quests
          .split(/[\n,]/)
          .map((quest) => quest.trim())
          .filter(Boolean)
      : [];
  const drops =
    typeof rawConfig.drops === "string" && rawConfig.drops.trim() !== ""
      ? rawConfig.drops
          .split(/[\n,]/)
          .map((drop) => drop.trim())
          .filter(Boolean)
      : [];

  return {
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
    rejectElse: Boolean(rawRejectElse),
  };
}

type UotlPacket = {
  params: {
    dataObj: string[];
    type: string;
  };
};
function packetHandler(packet: UotlPacket) {
  // Does it make sense to use run copy walk handler?
  if (!on || !config?.name) return;

  if (packet?.params?.type !== "str") return;

  const args = packet.params.dataObj;
  if (!args?.length) return;

  if (
    config?.copyWalk &&
    args[2]?.toLowerCase() === config.name &&
    args[0] === "uotls" &&
    args[3]?.includes("sp:") &&
    args[3]?.includes("tx:") &&
    args[3]?.includes("ty:")
  ) {
    const data = args[3]!.split(",");

    const spd = data.find((pkt) => pkt.startsWith("sp:"));
    const xPos = data.find((pkt) => pkt.startsWith("tx:"));
    const yPos = data.find((pkt) => pkt.startsWith("ty:"));
    const x = Number.parseInt(xPos!.split(":")[1]!, 10) ?? 0;
    const y = Number.parseInt(yPos!.split(":")[1]!, 10) ?? 0;
    const speed = Number.parseInt(spd!.split(":")[1]!, 10) ?? 8;

    bot.player.walkTo(x, y, speed);
  }
}

async function startFollower() {
  const cfg = config as FollowerConfig;
  const { name } = cfg;

  const foundPlayer = () => {
    if (!name || name.toLowerCase() === bot.auth?.username?.toLowerCase())
      return true;

    return (
      bot.world.isPlayerInMap(name) &&
      bot.world.isPlayerInCell(name, bot.player.cell)
    );
  };

  async function goToPlayer() {
    if (foundPlayer()) {
      attempts = 3;
      return;
    }

    // logger.info(`not found: ${name}`);

    await exitFromCombat();

    // logger.info(`goto ${name}`);
    bot.world.goto(name);

    await bot.waitUntil(() => bot.player.isReady() && foundPlayer(), null, 3);

    if (foundPlayer()) {
      attempts = 3;
      // logger.info(`found: ${name}`);
    } else {
      attempts--;

      // logger.info(`player ${name} not found: ${attempts}/3`);

      if (attempts <= 0) {
        // logger.info(`failed to find: ${name} after 3 attempts, stopping`);
        await stopFollower();
      }
    }
  }

  bot.on("pext", packetHandler);

  if (cfg.quests.length) {
    for (const quest of cfg.quests) registerQuest(quest);
    startQuestTimer();
  }

  if (cfg.drops.length) {
    for (const drop of cfg.drops) registerDrop(drop, cfg.rejectElse);
    startDropsTimer();
  }

  void interval(async (_, stop) => {
    if (!on) {
      stop();
      return;
    }

    if (!bot.player.isReady()) return;

    try {
      await mutex.acquire();

      const name_ = name || bot.auth?.username;

      if (
        !bot.world.isPlayerInMap(name_) ||
        !bot.world.isPlayerInCell(name_, bot.player.cell)
      ) {
        // logger.info("player not in map or cell");
        await goToPlayer();
        return;
      }

      bot.world.setSpawnPoint();

      if (!bot.world.availableMonsters.length) {
        return;
      }

      if (cfg.safeSkillEnabled && cfg.safeSkill.length) {
        for (const playerName of bot.world.playerNames) {
          const player = bot.world.players?.get(playerName);
          if (player?.isHpPercentageLessThan(cfg.safeSkillHp)) {
            await bot.combat.useSkill(cfg.safeSkill[safeIndex]!, true, false);
            safeIndex = (safeIndex + 1) % cfg.safeSkill.length;
            await bot.sleep(cfg.skillDelay);
            return;
          }
        }
      }

      doPriorityAttack(cfg.attackPriority);

      if (
        bot.world.isMonsterAvailable("*") &&
        !bot.combat?.target?.isMonster()
      ) {
        bot.combat.attack("*");
      }

      if (bot.combat.hasTarget()) {
        await bot.combat.useSkill(cfg.skillList[index]!, false, cfg.skillWait);
        index = (index + 1) % cfg.skillList!.length;
        await bot.sleep(cfg.skillDelay);
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

  bot.off("pext", packetHandler);
}

handlers.followerMe.handle(async () => {
  if (!bot.player.isReady()) return "";
  return bot.auth?.username ?? "";
});

handlers.followerStart.listen(async (input) => {
  config = parseConfig(input);

  if (config?.drops?.length) {
    await bot.bank.withdrawMultiple(config.drops);
  }

  // eslint-disable-next-line require-atomic-updates
  bot.settings.counterAttack = config?.antiCounter;
  await bot.waitUntil(() => bot.player.isReady(), null, -1);

  on = true;
  await startFollower();
});

handlers.followerStop.listen(async () => {
  on = false;
  await stopFollower();
});

type FollowerStartInput = Parameters<
  typeof handlers.followerStart.listen
>[0] extends (input: infer T) => any
  ? T
  : never;

type FollowerConfig = {
  antiCounter: boolean;
  attackPriority: string[];
  copyWalk: boolean;
  drops: string[];
  name: string;
  quests: string[];
  rejectElse: boolean;
  safeSkill: string[];
  safeSkillEnabled: boolean;
  safeSkillHp: number;
  skillDelay: number;
  skillList: string[];
  skillWait: boolean;
};
