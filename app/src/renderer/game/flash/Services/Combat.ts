import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface CombatShape {
  attackMonster(monster: string): BridgeEffect<void>;
  attackMonsterById(monMapId: number): BridgeEffect<void>;
  cancelAutoAttack(): BridgeEffect<void>;
  cancelTarget(): BridgeEffect<void>;
  forceUseSkill(index: number): BridgeEffect<void>;
  getSkillCooldownRemaining(index: number): BridgeEffect<number>;
  getTarget(): BridgeEffect<Record<string, unknown>>;
  hasTarget(): BridgeEffect<boolean>;
  useSkill(index: number): BridgeEffect<void>;
}

export class Combat extends ServiceMap.Service<Combat, CombatShape>()(
  "flash/Services/Combat",
) {}
