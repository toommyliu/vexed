import { describe, expect, it } from "vitest";
import type { CombatProfile } from "../../shared/combat-profiles";
import { getPreferredCombatProfileId } from "./combatProfileSelection";

const profile = (id: string): CombatProfile =>
  ({
    id,
    label: id,
  }) as CombatProfile;

describe("getPreferredCombatProfileId", () => {
  it("uses the preferred id when it exists", () => {
    expect(
      getPreferredCombatProfileId(
        [profile("generic"), profile("solo")],
        "solo",
      ),
    ).toBe("solo");
  });

  it("prefers a non-default profile when the preferred id is absent", () => {
    expect(
      getPreferredCombatProfileId(
        [profile("generic"), profile("solo")],
        "missing",
        "generic",
      ),
    ).toBe("solo");
  });

  it("falls back to the first profile", () => {
    expect(getPreferredCombatProfileId([profile("generic")], undefined)).toBe(
      "generic",
    );
  });

  it("falls back to the provided default id for an empty profile list", () => {
    expect(getPreferredCombatProfileId([], undefined, "generic")).toBe(
      "generic",
    );
  });
});
