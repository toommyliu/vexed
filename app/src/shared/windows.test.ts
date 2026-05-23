import { describe, expect, it } from "vitest";
import {
  WindowIds,
  getWindowDefinition,
  isAppWindowDefinition,
  isGameChildWindowDefinition,
  isWindowId,
} from "./windows";

describe("window catalog", () => {
  it("validates and resolves window ids", () => {
    expect(isWindowId(WindowIds.Environment)).toBe(true);
    expect(isWindowId("not-a-window")).toBe(false);
    expect(getWindowDefinition(WindowIds.Packets)).toEqual(
      expect.objectContaining({
        id: WindowIds.Packets,
        label: "Packets",
      }),
    );
  });

  it("classifies app and game-child window definitions", () => {
    const settings = getWindowDefinition(WindowIds.Settings);
    const environment = getWindowDefinition(WindowIds.Environment);
    const packets = getWindowDefinition(WindowIds.Packets);

    expect(settings && isAppWindowDefinition(settings)).toBe(true);
    expect(environment && isGameChildWindowDefinition(environment)).toBe(true);
    expect(packets && isGameChildWindowDefinition(packets)).toBe(true);
  });
});
