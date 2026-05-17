import { describe, expect, it } from "vitest";
import {
  advanceLoopTauntTurn,
  matchesLoopTauntMessage,
  normalizeLoopTauntOptions,
  ownsLoopTauntTurn,
  resolveLoopTauntParticipants,
} from "./LoopTaunt";

const players = ["Main", "Alt", "Third"] as const;

describe("Loop Taunt helpers", () => {
  it("requires an explicit target, skill, and single trigger", () => {
    expect(() =>
      normalizeLoopTauntOptions(
        { aura: "Focus", skill: 5, target: "Boss" },
        players,
      ),
    ).not.toThrow();

    expect(() =>
      normalizeLoopTauntOptions(
        { message: "defense shattering", skill: 5, target: "Boss" },
        players,
      ),
    ).not.toThrow();

    expect(() =>
      normalizeLoopTauntOptions({ skill: 5, target: "Boss" } as never, players),
    ).toThrow(/exactly one/);

    expect(() =>
      normalizeLoopTauntOptions(
        { aura: "Focus", message: "hit", skill: 5, target: "Boss" } as never,
        players,
      ),
    ).toThrow(/exactly one/);

    expect(() =>
      normalizeLoopTauntOptions(
        { aura: "", skill: 5, target: "Boss" },
        players,
      ),
    ).toThrow(/aura/);

    expect(() =>
      normalizeLoopTauntOptions(
        { aura: "Focus", skill: "", target: "Boss" },
        players,
      ),
    ).toThrow(/skill/);
  });

  it("resolves participants by army slots or names while preserving order", () => {
    expect(resolveLoopTauntParticipants(players, undefined)).toEqual([
      { name: "Main", number: 1 },
      { name: "Alt", number: 2 },
      { name: "Third", number: 3 },
    ]);

    expect(resolveLoopTauntParticipants(players, [2, "main"])).toEqual([
      { name: "Alt", number: 2 },
      { name: "Main", number: 1 },
    ]);
  });

  it("rejects unknown and duplicate participants", () => {
    expect(() => resolveLoopTauntParticipants(players, [4])).toThrow(
      /Unknown army player number/,
    );
    expect(() => resolveLoopTauntParticipants(players, ["Missing"])).toThrow(
      /Unknown army player name/,
    );
    expect(() => resolveLoopTauntParticipants(players, [1, "main"])).toThrow(
      /Duplicate loop taunt player/,
    );
  });

  it("advances turns in round-robin order", () => {
    const participants = resolveLoopTauntParticipants(players, [2, 1]);
    let state = { nextIndex: 0 };

    expect(ownsLoopTauntTurn(participants, 2, state)).toBe(true);
    expect(ownsLoopTauntTurn(participants, 1, state)).toBe(false);

    state = advanceLoopTauntTurn(participants, state);
    expect(ownsLoopTauntTurn(participants, 1, state)).toBe(true);

    state = advanceLoopTauntTurn(participants, state);
    expect(ownsLoopTauntTurn(participants, 2, state)).toBe(true);
  });

  it("matches combat messages case-insensitively with normalized whitespace", () => {
    expect(
      matchesLoopTauntMessage("Defense Shattering", "  defense   shattering!"),
    ).toBe(true);
    expect(matchesLoopTauntMessage("Defense Shattering", "other")).toBe(false);
  });
});
