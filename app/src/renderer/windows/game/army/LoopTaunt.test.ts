import { describe, expect, it } from "vitest";
import {
  advanceLoopTauntTurn,
  DEFAULT_LOOP_TAUNT_DELAY_MS,
  DEFAULT_LOOP_TAUNT_MESSAGE_DEBOUNCE_MS,
  LOOP_TAUNT_FOCUS_AURA_ICON,
  matchesLoopTauntAuraAdd,
  matchesLoopTauntMessage,
  normalizeLoopTauntOptions,
  ownsLoopTauntTurn,
  resolveLoopTauntTurn,
  resolveLoopTauntParticipants,
} from "./LoopTaunt";

const players = ["Main", "Alt", "Third"] as const;

describe("Loop Taunt helpers", () => {
  it("requires an explicit target, skill, and single trigger", () => {
    const normalized = normalizeLoopTauntOptions(
      {
        aura: "Focus",
        shouldTaunt: () => true,
        skill: 5,
        target: "Boss",
      },
      players,
    );
    expect(normalized.noEligiblePolicy).toBe("throw");
    expect(normalized.shouldTaunt).toBeTypeOf("function");
    expect(normalized.trigger).toEqual({
      aura: "Focus",
      delayMs: DEFAULT_LOOP_TAUNT_DELAY_MS,
      type: "aura",
    });

    expect(() =>
      normalizeLoopTauntOptions(
        { aura: "Focus", delayMs: 1234, skill: 5, target: "Boss" },
        players,
      ),
    ).not.toThrow();

    expect(
      normalizeLoopTauntOptions(
        { message: "defense shattering", skill: 5, target: "Boss" },
        players,
      ).trigger,
    ).toEqual({
      debounceMs: DEFAULT_LOOP_TAUNT_MESSAGE_DEBOUNCE_MS,
      message: "defense shattering",
      type: "message",
    });

    expect(
      normalizeLoopTauntOptions(
        {
          debounceMs: 1234.9,
          message: "defense shattering",
          skill: 5,
          target: "Boss",
        },
        players,
      ).trigger,
    ).toEqual({
      debounceMs: 1234,
      message: "defense shattering",
      type: "message",
    });

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

    expect(() =>
      normalizeLoopTauntOptions(
        { aura: "Focus", delayMs: -1, skill: 5, target: "Boss" },
        players,
      ),
    ).toThrow(/delayMs/);

    expect(() =>
      normalizeLoopTauntOptions(
        {
          debounceMs: -1,
          message: "defense shattering",
          skill: 5,
          target: "Boss",
        },
        players,
      ),
    ).toThrow(/debounceMs/);

    expect(() =>
      normalizeLoopTauntOptions(
        {
          aura: "Focus",
          shouldTaunt: true,
          skill: 5,
          target: "Boss",
        } as never,
        players,
      ),
    ).toThrow(/shouldTaunt/);

    expect(() =>
      normalizeLoopTauntOptions(
        {
          aura: "Focus",
          noEligiblePolicy: "skip",
          skill: 5,
          target: "Boss",
        } as never,
        players,
      ),
    ).toThrow(/noEligiblePolicy/);
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
    let state = { nextIndex: 0, triggerCount: 0 };

    expect(ownsLoopTauntTurn(participants, 2, state)).toBe(true);
    expect(ownsLoopTauntTurn(participants, 1, state)).toBe(false);

    state = advanceLoopTauntTurn(participants, state);
    expect(state.triggerCount).toBe(0);
    expect(ownsLoopTauntTurn(participants, 1, state)).toBe(true);

    state = advanceLoopTauntTurn(participants, state);
    expect(ownsLoopTauntTurn(participants, 2, state)).toBe(true);
  });

  it("resolves turn selection from the scheduled participant", () => {
    const participants = resolveLoopTauntParticipants(players, [2, 1, 3]);
    const resolution = resolveLoopTauntTurn(
      participants,
      { nextIndex: 0, triggerCount: 2 },
      () => true,
    );

    expect(resolution.scheduled).toEqual({ name: "Alt", number: 2 });
    expect(resolution.selected).toEqual({ name: "Alt", number: 2 });
    expect(resolution.skipped).toEqual([]);
    expect(resolution.nextState).toEqual({ nextIndex: 1, triggerCount: 3 });
  });

  it("skips candidates and advances after the selected replacement", () => {
    const participants = resolveLoopTauntParticipants(players, [2, 1, 3]);
    const resolution = resolveLoopTauntTurn(
      participants,
      { nextIndex: 0, triggerCount: 0 },
      (candidate) => candidate.number === 3,
    );

    expect(resolution.scheduled).toEqual({ name: "Alt", number: 2 });
    expect(resolution.selected).toEqual({ name: "Third", number: 3 });
    expect(resolution.skipped).toEqual([
      { name: "Alt", number: 2 },
      { name: "Main", number: 1 },
    ]);
    expect(resolution.nextState).toEqual({ nextIndex: 0, triggerCount: 1 });
  });

  it("wraps turn selection around the participant list", () => {
    const participants = resolveLoopTauntParticipants(players, [2, 1, 3]);
    const resolution = resolveLoopTauntTurn(
      participants,
      { nextIndex: 2, triggerCount: 0 },
      (candidate) => candidate.number === 2,
    );

    expect(resolution.scheduled).toEqual({ name: "Third", number: 3 });
    expect(resolution.selected).toEqual({ name: "Alt", number: 2 });
    expect(resolution.skipped).toEqual([{ name: "Third", number: 3 }]);
    expect(resolution.nextState).toEqual({ nextIndex: 1, triggerCount: 1 });
  });

  it("handles no eligible candidates according to policy", () => {
    const participants = resolveLoopTauntParticipants(players, [2, 1]);

    expect(() =>
      resolveLoopTauntTurn(
        participants,
        { nextIndex: 0, triggerCount: 0 },
        () => false,
      ),
    ).toThrow(/no eligible/);

    expect(
      resolveLoopTauntTurn(
        participants,
        { nextIndex: 0, triggerCount: 0 },
        () => false,
        "cast-scheduled",
      ),
    ).toMatchObject({
      nextState: { nextIndex: 1, triggerCount: 1 },
      scheduled: { name: "Alt", number: 2 },
      selected: { name: "Alt", number: 2 },
      skipped: [
        { name: "Alt", number: 2 },
        { name: "Main", number: 1 },
      ],
    });
  });

  it("matches combat messages case-insensitively with normalized whitespace", () => {
    expect(
      matchesLoopTauntMessage("Defense Shattering", "  defense   shattering!"),
    ).toBe(true);
    expect(matchesLoopTauntMessage("Defense Shattering", "other")).toBe(false);
  });

  it("matches loop taunt Focus only when the scroll taunt icon is present", () => {
    expect(
      matchesLoopTauntAuraAdd("Focus", "Focus", {
        icon: LOOP_TAUNT_FOCUS_AURA_ICON,
      }),
    ).toBe(true);
    expect(
      matchesLoopTauntAuraAdd("Focus", "Focus", {
        icon: "i,i,i,Chavengea2",
      }),
    ).toBe(false);
    expect(matchesLoopTauntAuraAdd("Focus", "Focus")).toBe(false);
    expect(matchesLoopTauntAuraAdd("Other Aura", "Other Aura")).toBe(true);
  });
});
