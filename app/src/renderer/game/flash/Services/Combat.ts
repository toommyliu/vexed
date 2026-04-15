import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface CombatShape {
  attackMonster(monster: string): BridgeEffect<void>;
  cancelAutoAttack(): BridgeEffect<void>;
  cancelTarget(): BridgeEffect<void>;
  getSkillCooldownRemaining(index: number | string): BridgeEffect<number>;
  getTarget(): BridgeEffect<Record<string, unknown>>;
  hasTarget(): BridgeEffect<boolean>;
  kill(target: MonsterIdentifierToken): BridgeEffect<void>;
  killForItem(
    target: MonsterIdentifierToken,
    item: ItemIdentifierToken,
    quantity?: number,
  ): BridgeEffect<void>;
  killForTempItem(
    target: MonsterIdentifierToken,
    item: ItemIdentifierToken,
    quantity?: number,
  ): BridgeEffect<void>;
  useSkill(
    index: number | string,
    force?: boolean,
    wait?: boolean,
  ): BridgeEffect<void>;
}

export class Combat extends ServiceMap.Service<Combat, CombatShape>()(
  "flash/Services/Combat",
) {}
