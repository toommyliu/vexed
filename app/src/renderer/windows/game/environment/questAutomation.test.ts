import { describe, expect, test } from "vitest";
import {
  canRunQuestAction,
  clearQuestActionFailure,
  createQuestAutomationIntent,
  getQuestActionKey,
  getQuestMutationDelayMs,
  recordQuestActionFailure,
} from "./questAutomation";

describe("createQuestAutomationIntent", () => {
  test("completes an in-progress quest that can be completed", () => {
    expect(
      createQuestAutomationIntent({
        questId: 609,
        rewardItemId: 42,
        inProgress: true,
        canComplete: true,
        available: false,
      }),
    ).toEqual({
      action: "complete",
      questId: 609,
      rewardItemId: 42,
    });
  });

  test("accepts an available quest that is not in progress", () => {
    expect(
      createQuestAutomationIntent({
        questId: 2857,
        inProgress: false,
        canComplete: false,
        available: true,
      }),
    ).toEqual({
      action: "accept",
      questId: 2857,
    });
  });

  test("does nothing when a quest is neither actionable nor available", () => {
    expect(
      createQuestAutomationIntent({
        questId: 1,
        inProgress: false,
        canComplete: false,
        available: false,
      }),
    ).toEqual({
      action: "none",
      questId: 1,
    });
  });
});

describe("quest action pacing", () => {
  test("identifies mutable quest actions by action and quest id", () => {
    expect(getQuestActionKey({ action: "accept", questId: 1 })).toBe(
      "quest:accept:1",
    );
    expect(getQuestActionKey({ action: "complete", questId: 1 })).toBe(
      "quest:complete:1",
    );
    expect(getQuestActionKey({ action: "none", questId: 1 })).toBeUndefined();
  });

  test("backs off failed actions and clears backoff after success", () => {
    const firstFailure = recordQuestActionFailure(
      new Map(),
      "quest:accept:1",
      1_000,
    );
    expect(canRunQuestAction(firstFailure, "quest:accept:1", 2_999)).toBe(
      false,
    );
    expect(canRunQuestAction(firstFailure, "quest:accept:1", 3_000)).toBe(true);

    const secondFailure = recordQuestActionFailure(
      firstFailure,
      "quest:accept:1",
      3_000,
    );
    expect(canRunQuestAction(secondFailure, "quest:accept:1", 7_999)).toBe(
      false,
    );
    expect(canRunQuestAction(secondFailure, "quest:accept:1", 8_000)).toBe(
      true,
    );

    expect(
      canRunQuestAction(
        clearQuestActionFailure(secondFailure, "quest:accept:1"),
        "quest:accept:1",
        3_001,
      ),
    ).toBe(true);
  });

  test("computes the remaining mutation delay from the last mutation time", () => {
    expect(getQuestMutationDelayMs(1_000, 1_200)).toBe(550);
    expect(getQuestMutationDelayMs(1_000, 1_750)).toBe(0);
  });
});
