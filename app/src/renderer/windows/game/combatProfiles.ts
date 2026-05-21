import type { Aura, Monster } from "@vexed/game";
import { Effect, Option, Ref } from "effect";
import type {
  CombatProfile,
  CombatProfileAuraCondition,
  CombatProfileCondition,
  CombatProfileStatCondition,
  CombatProfileStep,
} from "../../../shared/combat-profiles";
import { Combat } from "./flash/Services/Combat";
import { Player } from "./flash/Services/Player";
import { World } from "./flash/Services/World";

export interface CombatProfileCursor {
  readonly index: Ref.Ref<number>;
}

export const makeCombatProfileCursor = (): Effect.Effect<CombatProfileCursor> =>
  Effect.map(Ref.make(0), (index) => ({ index }));

const compare = (
  actual: number,
  op: CombatProfileStatCondition["op"],
  expected: number,
): boolean => (op === ">=" ? actual >= expected : actual <= expected);

const statValue = (
  current: number,
  max: number,
  unit: CombatProfileStatCondition["unit"],
): number => {
  if (unit === "value") {
    return current;
  }

  return max > 0 ? (current / max) * 100 : 0;
};

const auraValue = (aura: Aura | undefined): number =>
  aura === undefined ? 0 : (aura.stack ?? aura.value ?? 1);

const getSelfEntId = Effect.gen(function* () {
  const world = yield* World;
  return yield* world.players.withSelf((me) => me.data.entID);
});

const getTargetAura = (condition: CombatProfileAuraCondition) =>
  Effect.gen(function* () {
    const combat = yield* Combat;
    const world = yield* World;
    const target = yield* combat.getTarget();

    if (!target) {
      return 0;
    }

    if (target.isMonster()) {
      const aura = yield* world.monsters.getAura(
        target.monMapId,
        condition.auraName,
      );
      return auraValue(Option.isSome(aura) ? aura.value : undefined);
    }

    const aura = yield* world.players.getAura(
      target.data.entID,
      condition.auraName,
    );
    return auraValue(Option.isSome(aura) ? aura.value : undefined);
  });

const matchesStatCondition = (condition: CombatProfileStatCondition) =>
  Effect.gen(function* () {
    const player = yield* Player;
    const world = yield* World;

    if (condition.type === "self-hp") {
      const hp = yield* player.getHp();
      const maxHp = yield* player.getMaxHp();
      return compare(
        statValue(hp, maxHp, condition.unit),
        condition.op,
        condition.value,
      );
    }

    if (condition.type === "self-mp") {
      const mp = yield* player.getMp();
      const maxMp = yield* player.getMaxMp();
      return compare(
        statValue(mp, maxMp, condition.unit),
        condition.op,
        condition.value,
      );
    }

    const self = yield* world.players.withSelf((me) => ({
      entId: me.data.entID,
      username: me.username.toLowerCase(),
    }));
    if (Option.isNone(self)) {
      return false;
    }

    const players = yield* world.players.getAll();
    for (const ally of players.values()) {
      if (
        ally.data.entID === self.value.entId ||
        ally.username.toLowerCase() === self.value.username
      ) {
        continue;
      }

      if (
        compare(
          statValue(ally.hp, ally.maxHp, condition.unit),
          condition.op,
          condition.value,
        )
      ) {
        return true;
      }
    }

    return false;
  });

const matchesAuraCondition = (condition: CombatProfileAuraCondition) =>
  Effect.gen(function* () {
    const world = yield* World;
    const actual =
      condition.type === "target-aura"
        ? yield* getTargetAura(condition)
        : yield* Effect.gen(function* () {
            const entId = yield* getSelfEntId;
            if (Option.isNone(entId)) {
              return 0;
            }

            const aura = yield* world.players.getAura(
              entId.value,
              condition.auraName,
            );
            return auraValue(Option.isSome(aura) ? aura.value : undefined);
          });

    return compare(actual, condition.op, condition.value);
  });

const matchesCondition = (condition: CombatProfileCondition) => {
  switch (condition.type) {
    case "self-aura":
    case "target-aura":
      return matchesAuraCondition(condition);
    case "self-hp":
    case "self-mp":
    case "ally-hp":
      return matchesStatCondition(condition);
  }
};

const matchesStep = (step: CombatProfileStep) =>
  Effect.gen(function* () {
    for (const condition of step.conditions) {
      if (!(yield* matchesCondition(condition))) {
        return false;
      }
    }

    return true;
  });

export const castNextCombatProfileStep = (
  profile: CombatProfile,
  cursor: CombatProfileCursor,
) =>
  Effect.gen(function* () {
    const combat = yield* Combat;
    const steps = profile.steps;
    if (steps.length === 0) {
      return false;
    }

    const startIndex = yield* Ref.get(cursor.index);

    for (let offset = 0; offset < steps.length; offset += 1) {
      const stepIndex = (startIndex + offset) % steps.length;
      const step = steps[stepIndex];
      if (!step || !(yield* matchesStep(step))) {
        continue;
      }

      const shouldWait =
        profile.cooldownMode === "wait-for-cooldown" &&
        step.skipIfUnavailable !== true;

      if (!shouldWait && !(yield* combat.canUseSkill(step.skill))) {
        continue;
      }

      yield* Ref.set(cursor.index, (stepIndex + 1) % steps.length);
      yield* combat.useSkill(step.skill, false, shouldWait);

      if (step.waitMs !== undefined && step.waitMs > 0) {
        yield* Effect.sleep(`${step.waitMs} millis`);
      }

      return true;
    }

    return false;
  });

export const isAttackableMonster = (monster: Monster): boolean =>
  monster.alive && !monster.isDead();
