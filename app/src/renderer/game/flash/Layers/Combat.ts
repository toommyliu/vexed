import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Combat } from "../Services/Combat";
import type { CombatShape } from "../Services/Combat";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    attackMonster: (monster: string) =>
      bridge.call("combat.attackMonster", [monster]),
    attackMonsterById: (monMapId: number) =>
      bridge.call("combat.attackMonsterById", [monMapId]),
    cancelAutoAttack: () => bridge.call("combat.cancelAutoAttack"),
    cancelTarget: () => bridge.call("combat.cancelTarget"),
    forceUseSkill: (index: number) =>
      bridge.call("combat.forceUseSkill", [String(index)]),
    getSkillCooldownRemaining: (index: number) =>
      bridge.call("combat.getSkillCooldownRemaining", [index]),
    getTarget: () => bridge.call("combat.getTarget"),
    hasTarget: () => bridge.call("combat.hasTarget"),
    useSkill: (index: number) => bridge.call("combat.useSkill", [String(index)]),
  } satisfies CombatShape;
});

export const CombatLive = Layer.effect(Combat, make);
