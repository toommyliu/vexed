import { interval } from "@vexed/utils";
import { get } from "svelte/store";
import { DEFAULT_FOLLOWER_ATTEMPTS } from "~/shared/follower/constants";
import { normalizeFollowerConfig } from "~/shared/follower/helpers";
import {
  type FollowerConfig,
  type RawFollowerConfig,
} from "~/shared/follower/types";
import { handlers } from "~/shared/tipc";
import { Bot } from "../lib/Bot";
import {
  followerConfig,
  followerEnabled,
  resetFollowerState,
} from "../state/follower";
import { doPriorityAttack } from "../util/doPriorityAttack";

const bot = Bot.getInstance();

let skillIndex = 0;
let safeSkillIndex = 0;
let attemptsLeft = DEFAULT_FOLLOWER_ATTEMPTS;
let runToken = 0; // used to track "instances" of a start call

type UotlPacket = {
  params: {
    dataObj: string[];
    type: string;
  };
};

function resetRuntimeCounters() {
  skillIndex = 0;
  safeSkillIndex = 0;
  attemptsLeft = DEFAULT_FOLLOWER_ATTEMPTS;
}

function getConfig(): FollowerConfig | null {
  return get(followerConfig);
}

function isRunActive(token: number): boolean {
  return get(followerEnabled) && runToken === token;
}

function parseMovementData(
  data: string,
): { speed: number; x: number; y: number } | null {
  let speed = 8;
  let x: number | null = null;
  let y: number | null = null;
  for (const segment of data.split(",")) {
    const [rawKey, rawValue] = segment.split(":");
    if (!rawKey || !rawValue) continue;
    const value = Number(rawValue);
    if (Number.isNaN(value)) continue;
    if (rawKey === "sp") speed = value;
    if (rawKey === "tx") x = value;
    if (rawKey === "ty") y = value;
  }

  if (x === null || y === null) return null;
  return { speed, x, y };
}

function packetHandler(packet: UotlPacket) {
  if (!get(followerEnabled)) return;
  const cfg = getConfig();
  if (!cfg?.copyWalk || !cfg.name) return;
  if (packet?.params?.type !== "str") return;
  const args = packet.params.dataObj;
  if (!args?.length) return;
  if (
    args[0] !== "uotls" ||
    args[2]?.toLowerCase() !== cfg.name ||
    !args[3]?.includes("sp:") ||
    !args[3]?.includes("tx:") ||
    !args[3]?.includes("ty:")
  )
    return;
  const movement = parseMovementData(args[3]);
  if (!movement) return;
  bot.player.walkTo(movement.x, movement.y, movement.speed);
}

function isTargetPresent(cfg: FollowerConfig): boolean {
  const selfName = bot.auth?.username?.toLowerCase();
  if (!cfg.name || cfg.name === selfName) return true;
  return (
    bot.world.isPlayerInMap(cfg.name) &&
    bot.world.isPlayerInCell(cfg.name, bot.player.cell)
  );
}

async function stopFollower() {
  runToken += 1;
  resetRuntimeCounters();
  resetFollowerState();
  bot.off("pext", packetHandler);
}

async function tryMoveToTarget(cfg: FollowerConfig): Promise<boolean> {
  // Target is in the same cell
  if (isTargetPresent(cfg)) {
    attemptsLeft = DEFAULT_FOLLOWER_ATTEMPTS;
    return true;
  }

  // "we" are the target
  if (!cfg.name) {
    attemptsLeft = DEFAULT_FOLLOWER_ATTEMPTS;
    return true;
  }

  // Try to jump to target
  if (bot.world.isPlayerInMap(cfg.name)) {
    const targetPlayer = bot.world.players?.get(cfg.name);
    if (targetPlayer) {
      await bot.world.jump(targetPlayer.cell, targetPlayer.pad);
      await bot.waitUntil(() => isTargetPresent(cfg));
    }
  } else {
    await bot.combat.exit();
    bot.world.goto(cfg.name);
    await bot.waitUntil(() => bot.player.isReady() && isTargetPresent(cfg), {
      timeout: 10_000,
    });
  }

  // Jump successful
  if (isTargetPresent(cfg)) {
    attemptsLeft = DEFAULT_FOLLOWER_ATTEMPTS;
    return true;
  }

  attemptsLeft -= 1;

  // Failed to find target after all attempts
  if (attemptsLeft <= 0) await stopFollower();
  return false;
}

/**
 * @returns true if a safe skill was used
 */
async function runSafeSkill(cfg: FollowerConfig): Promise<boolean> {
  if (!cfg.safeSkillEnabled || cfg.safeSkill.length === 0) return false;
  for (const player of bot.world.players.all().values()) {
    if (!player?.isHpPercentageLessThan(cfg.safeSkillHp)) continue;
    const skill = cfg.safeSkill[safeSkillIndex];
    if (!skill) return false;
    await bot.combat.useSkill(skill, true, false);
    safeSkillIndex = (safeSkillIndex + 1) % cfg.safeSkill.length;
    await bot.sleep(cfg.skillDelay);
    return true;
  }

  return false;
}

async function runCombatLoop(cfg: FollowerConfig) {
  bot.world.setSpawnPoint();

  if (!bot.world.availableMonsters.length) return;
  if (await runSafeSkill(cfg)) return;

  doPriorityAttack(cfg.attackPriority);

  if (bot.world.isMonsterAvailable("*") && !bot.combat?.target?.isMonster())
    bot.combat.attack("*");

  if (!bot.combat.hasTarget()) return;
  const skill = cfg.skillList[skillIndex];
  if (!skill) return;
  await bot.combat.useSkill(skill, false, cfg.skillWait);
  skillIndex = (skillIndex + 1) % cfg.skillList.length;
  await bot.sleep(cfg.skillDelay);
}

function startFollowerLoop(token: number) {
  void interval(async (_, stop) => {
    if (!isRunActive(token)) {
      stop();
      return;
    }

    if (!bot.player.isReady()) return;
    if (!isRunActive(token)) return;

    const cfg = getConfig();
    if (!cfg) {
      await stopFollower();
      stop();
      return;
    }

    if (!isTargetPresent(cfg)) {
      await tryMoveToTarget(cfg);
      return;
    }

    await runCombatLoop(cfg);
  }, 500).catch((error) => {
    console.error("Follower loop stopped unexpectedly", error);
    void stopFollower();
  });
}

handlers.follower.me.handle(async () => {
  if (!bot.player.isReady()) return "";
  return bot.auth?.username?.toLowerCase() ?? "";
});

handlers.follower.start.listen(async (input: RawFollowerConfig) => {
  const token = ++runToken;
  const config = normalizeFollowerConfig(input, bot.auth?.username);
  followerConfig.set(config);
  followerEnabled.set(true);
  resetRuntimeCounters();
  bot.off("pext", packetHandler);
  if (config.copyWalk) {
    bot.on("pext", packetHandler);
  }

  await bot.waitUntil(() => bot.player.isReady());
  if (!isRunActive(token)) return;
  startFollowerLoop(token);
});

handlers.follower.stop.listen(async () => {
  await stopFollower();
});
