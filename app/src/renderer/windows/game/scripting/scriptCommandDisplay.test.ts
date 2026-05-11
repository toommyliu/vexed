import { describe, expect, it } from "vitest";
import {
  formatArgument,
  formatInstructionArgs,
  toScriptCommandDisplayItem,
} from "./scriptCommandDisplay";
import type { ScriptInstruction } from "./Types";

describe("script command display", () => {
  it("formats primitive and structured arguments compactly", () => {
    expect(
      formatInstructionArgs([
        "Sword",
        8152,
        true,
        ["a", "b", "c", "d", "e"],
        { item: "Blade", quantity: 3, silent: false, extra: "hidden" },
      ]),
    ).toBe(
      '"Sword", 8152, true, ["a", "b", "c", "d", ...], {item: "Blade", quantity: 3, silent: false, ...}',
    );
  });

  it("uses stable labels and one-based display indices at render time", () => {
    const instruction = {
      name: "accept_quest",
      args: [8152],
      index: 4,
    } satisfies ScriptInstruction;

    expect(toScriptCommandDisplayItem(instruction)).toEqual({
      index: 4,
      name: "accept_quest",
      label: "accept quest",
      argsText: "8152",
    });
  });

  it("truncates long values without throwing on functions", () => {
    expect(formatArgument(() => undefined)).toBe("fn");
    expect(formatArgument("x".repeat(90))).toHaveLength(74);
  });
});
