import { splitCsv } from "../csv";
import {
  DEFAULT_FOLLOWER_SAFE_SKILL_HP,
  DEFAULT_FOLLOWER_SKILL_DELAY,
  DEFAULT_FOLLOWER_SKILL_LIST,
} from "./constants";
import type { FollowerConfig, RawFollowerConfig } from "./types";

function parseIntOrDefault(
  value: string,
  fallback: number,
  min?: number,
  max?: number,
): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}

export function normalizeFollowerConfig(
  rawConfig: RawFollowerConfig,
  fallbackName?: string,
): FollowerConfig {
  const name = (
    rawConfig.name.trim() === "" ? (fallbackName ?? "") : rawConfig.name
  )
    .trim()
    .toLowerCase();
  const skillList = splitCsv(rawConfig.skillList);
  const safeSkill = splitCsv(rawConfig.safeSkill);
  return {
    name,
    skillList:
      skillList.length > 0 ? skillList : [...DEFAULT_FOLLOWER_SKILL_LIST],
    skillWait: Boolean(rawConfig.skillWait),
    skillDelay: parseIntOrDefault(
      rawConfig.skillDelay,
      DEFAULT_FOLLOWER_SKILL_DELAY,
      0,
    ),
    copyWalk: Boolean(rawConfig.copyWalk),
    attackPriority: splitCsv(rawConfig.attackPriority),
    safeSkillEnabled: Boolean(rawConfig.safeSkillEnabled),
    safeSkill,
    safeSkillHp: parseIntOrDefault(
      rawConfig.safeSkillHp,
      DEFAULT_FOLLOWER_SAFE_SKILL_HP,
      1,
      100,
    ),
  };
}
