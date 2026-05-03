import { ServiceMap } from "effect";
import type { Avatar, Monster } from "@vexed/game";
import type { BridgeEffect } from "./Bridge";
import type { ActiveSkillItem } from "../Types";

export interface CombatKillOptions {
  readonly killPriority?: readonly MonsterIdentifierToken[] | string;
  readonly skillSet?: readonly Skill[] | string;
  readonly skillDelay?: number;
  readonly skillWait?: boolean;
}

export interface CombatShape {
  attackMonster(monster: MonsterIdentifierToken): BridgeEffect<void>;
  cancelAutoAttack(): BridgeEffect<void>;
  cancelTarget(): BridgeEffect<void>;
  canUseSkill(index: number | string): BridgeEffect<boolean>;
  exit(): BridgeEffect<boolean>;
  getActiveSkillItem(
    index: number | string,
  ): BridgeEffect<ActiveSkillItem | null>;
  getTarget(): BridgeEffect<Monster | Avatar | null>;
  hasTarget(): BridgeEffect<boolean>;
  kill(
    target: MonsterIdentifierToken,
    options?: CombatKillOptions,
  ): BridgeEffect<void>;
  killForItem(
    target: MonsterIdentifierToken,
    item: ItemIdentifierToken,
    quantity?: number,
    options?: CombatKillOptions,
  ): BridgeEffect<void>;
  killForTempItem(
    target: MonsterIdentifierToken,
    item: ItemIdentifierToken,
    quantity?: number,
    options?: CombatKillOptions,
  ): BridgeEffect<void>;
  useSkill(
    index: number | string,
    force?: boolean,
    wait?: boolean,
  ): BridgeEffect<void>;
  hunt(
    target: MonsterIdentifierToken,
    findMost?: boolean,
  ): BridgeEffect<string>;
}

export class Combat extends ServiceMap.Service<Combat, CombatShape>()(
  "flash/Services/Combat",
) {}
