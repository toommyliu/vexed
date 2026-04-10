import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Combat } from "../Services/Combat";
import type { CombatShape } from "../Services/Combat";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const isValidSkillIndex = (index: Skill) => {
    const idx = Number.parseInt(String(index));
    return idx >= 0 && idx <= 5;
  };

  const attackMonster = (monster: MonsterName) =>
    bridge.call("combat.attackMonster", [monster]);

  const attackMonsterById = (monMapId: number) =>
    bridge.call("combat.attackMonsterById", [monMapId]);

  const cancelAutoAttack = () => bridge.call("combat.cancelAutoAttack");

  const cancelTarget = () => bridge.call("combat.cancelTarget");

  const getSkillCooldownRemaining = (index: number | string) =>
    Effect.gen(function* () {
      const idx = Number.parseInt(String(index));
      if (!isValidSkillIndex(idx)) return yield* Effect.succeed(0);

      return yield* bridge.call("combat.getSkillCooldownRemaining", [idx]);
    });

  const useSkill = (index: Skill, force?: boolean, wait?: boolean) =>
    Effect.gen(function* () {
      const strIndex = String(index);
      const idx = Number.parseInt(strIndex);
      if (!isValidSkillIndex(idx)) return yield* Effect.void;

      if (wait) {
        const duration = yield* bridge.call(
          "combat.getSkillCooldownRemaining",
          [idx],
        );
        yield* Effect.sleep(duration);
      }

      if (force) {
        yield* bridge.call("combat.forceUseSkill", [strIndex]);
        return;
      }

      yield* bridge.call("combat.useSkill", [strIndex]);
    });

  const kill = (target: number | string, { skills }: { skills: Skill[] }) =>
    Effect.gen(function* () {
      // TODO: implement kill logic
      target;
      skills;
    });
  kill;

  const hasTarget = () => bridge.call("combat.hasTarget");

  const getTarget = () => bridge.call("combat.getTarget");

  return {
    attackMonster,
    attackMonsterById,
    cancelAutoAttack,
    cancelTarget,
    useSkill,
    getSkillCooldownRemaining,
    getTarget,
    hasTarget,
  } satisfies CombatShape;
});

export const CombatLive = Layer.effect(Combat, make);
