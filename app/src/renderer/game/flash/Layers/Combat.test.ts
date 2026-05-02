import { Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Combat, type CombatShape } from "../Services/Combat";
import { Drops, type DropsShape } from "../Services/Drops";
import { Player, type PlayerShape } from "../Services/Player";
import { CombatLive } from "./Combat";

const drops = {
  acceptDrop: () => Effect.void,
  containsDrop: () => Effect.succeed(false),
  isUsingCustomDrops: () => Effect.succeed(false),
  rejectDrop: () => Effect.succeed(false),
  toggleUi: () => Effect.void,
} satisfies DropsShape;

const player = {} as PlayerShape;

const makeBridge = (
  cooldowns: readonly number[],
  calls: string[],
): BridgeShape => {
  let cooldownIndex = 0;

  return {
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      if (path === "combat.getTarget") {
        calls.push("combat.getTarget");
        return Effect.succeed(null) as Effect.Effect<
          ReturnType<Window["swf"][K]>
        >;
      }

      if (path === "combat.getSkillCooldownRemaining") {
        const cooldown =
          cooldowns[Math.min(cooldownIndex, cooldowns.length - 1)] ?? 0;
        cooldownIndex += 1;
        calls.push(`combat.getSkillCooldownRemaining:${cooldown}`);
        return Effect.succeed(cooldown) as Effect.Effect<
          ReturnType<Window["swf"][K]>
        >;
      }

      if (path === "combat.forceUseSkill") {
        calls.push(`combat.forceUseSkill:${String(args?.[0])}`);
        return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  };
};

const withCombat = async <A>(
  bridge: BridgeShape,
  body: (combat: CombatShape) => Effect.Effect<A, unknown>,
): Promise<A> =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const combat = yield* Combat;
        return yield* body(combat);
      }),
    ).pipe(
      Effect.provide(
        CombatLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Bridge)(bridge),
              Layer.succeed(Drops)(drops),
              Layer.succeed(Player)(player),
            ),
          ),
        ),
      ),
    ),
  );

test("force useSkill waits through cooldown and confirmation before casting", async () => {
  const calls: string[] = [];

  await withCombat(makeBridge([20, 0, 20, 0, 0], calls), (combat) =>
    combat.useSkill(5, true, true),
  );

  expect(calls).toEqual([
    "combat.getTarget",
    "combat.getSkillCooldownRemaining:20",
    "combat.getSkillCooldownRemaining:0",
    "combat.getSkillCooldownRemaining:20",
    "combat.getSkillCooldownRemaining:0",
    "combat.getSkillCooldownRemaining:0",
    "combat.getTarget",
    "combat.forceUseSkill:5",
  ]);
});
