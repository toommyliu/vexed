import { Effect } from "effect";
import { expect, test } from "vitest";
import {
  type CombatProfile,
  type CombatProfileCooldownMode,
} from "../../../shared/combat-profiles";
import { Combat, type CombatShape } from "./flash/Services/Combat";
import { Player, type PlayerShape } from "./flash/Services/Player";
import { World, type WorldShape } from "./flash/Services/World";
import {
  castNextCombatProfileStep,
  makeCombatProfileCursor,
} from "./combatProfiles";

const profile = (
  cooldownMode: CombatProfileCooldownMode,
  steps: CombatProfile["steps"],
): CombatProfile => ({
  id: "test",
  label: "Test",
  role: "Test",
  delayMs: 0,
  cooldownMode,
  timeoutMs: 10_000,
  steps,
});

const runCast = async (
  combat: CombatShape,
  combatProfile: CombatProfile,
): Promise<boolean> =>
  await Effect.runPromise(
    Effect.gen(function* () {
      const cursor = yield* makeCombatProfileCursor();
      return yield* castNextCombatProfileStep(combatProfile, cursor);
    }).pipe(
      Effect.provideService(Combat, combat),
      Effect.provideService(Player, {} as unknown as PlayerShape),
      Effect.provideService(World, {} as unknown as WorldShape),
    ),
  );

test("combat profile skip mode skips unavailable skills", async () => {
  const calls: string[] = [];
  const combat = {
    canUseSkill: (skill: number | string) =>
      Effect.sync(() => {
        calls.push(`can:${String(skill)}`);
        return skill === 2;
      }),
    useSkill: (skill: number | string, force?: boolean, wait?: boolean) =>
      Effect.sync(() => {
        calls.push(`use:${String(skill)}:${String(force)}:${String(wait)}`);
      }),
  } as unknown as CombatShape;

  await expect(
    runCast(
      combat,
      profile("use-if-ready", [
        { id: "one", skill: 1, conditions: [] },
        { id: "two", skill: 2, conditions: [] },
      ]),
    ),
  ).resolves.toBe(true);
  expect(calls).toEqual(["can:1", "can:2", "use:2:false:false"]);
});

test("combat profile wait mode casts with wait enabled", async () => {
  const calls: string[] = [];
  const combat = {
    canUseSkill: () => {
      throw new Error("canUseSkill should not be called for wait mode");
    },
    useSkill: (skill: number | string, force?: boolean, wait?: boolean) =>
      Effect.sync(() => {
        calls.push(`use:${String(skill)}:${String(force)}:${String(wait)}`);
      }),
  } as unknown as CombatShape;

  await expect(
    runCast(
      combat,
      profile("wait-for-cooldown", [{ id: "one", skill: 1, conditions: [] }]),
    ),
  ).resolves.toBe(true);
  expect(calls).toEqual(["use:1:false:true"]);
});

test("combat profile step cooldown mode overrides the profile mode", async () => {
  const calls: string[] = [];
  const combat = {
    canUseSkill: (skill: number | string) =>
      Effect.sync(() => {
        calls.push(`can:${String(skill)}`);
        return false;
      }),
    useSkill: (skill: number | string, force?: boolean, wait?: boolean) =>
      Effect.sync(() => {
        calls.push(`use:${String(skill)}:${String(force)}:${String(wait)}`);
      }),
  } as unknown as CombatShape;

  await expect(
    runCast(
      combat,
      profile("wait-for-cooldown", [
        {
          id: "skip",
          skill: 1,
          conditions: [],
          cooldownMode: "use-if-ready",
        },
        { id: "wait", skill: 2, conditions: [] },
      ]),
    ),
  ).resolves.toBe(true);
  expect(calls).toEqual(["can:1", "use:2:false:true"]);
});
