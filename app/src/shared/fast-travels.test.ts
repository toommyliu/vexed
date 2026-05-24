import { describe, expect, it } from "vitest";
import {
  DEFAULT_FAST_TRAVELS,
  FastTravelDuplicateNameError,
  FastTravelNotFoundError,
  FastTravelValidationError,
  addFastTravel,
  deleteFastTravel,
  fastTravelMapTarget,
  normalizeFastTravelDraft,
  normalizeFastTravelRoomNumber,
  normalizeFastTravelWarpPayload,
  normalizeFastTravels,
  updateFastTravel,
  type FastTravel,
} from "./fast-travels";

describe("fast travel helpers", () => {
  it("normalizes drafts", () => {
    expect(
      normalizeFastTravelDraft({
        name: "  Escherion  ",
        map: "  Escherion ",
        cell: " Boss ",
        pad: " Left ",
      }),
    ).toEqual({
      name: "Escherion",
      map: "escherion",
      cell: "Boss",
      pad: "Left",
    });

    expect(
      normalizeFastTravelDraft({
        name: "Home",
        map: "Battleon",
        cell: " ",
        pad: "",
      }),
    ).toEqual({ name: "Home", map: "battleon" });
  });

  it("rejects missing required fields", () => {
    expect(() =>
      normalizeFastTravelDraft({ name: "", map: "battleon" }),
    ).toThrow(FastTravelValidationError);
    expect(() => normalizeFastTravelDraft({ name: "Home", map: "" })).toThrow(
      FastTravelValidationError,
    );
  });

  it("normalizes stored lists and dedupes names case-insensitively", () => {
    expect(
      normalizeFastTravels([
        { name: "Home", map: "Battleon" },
        { name: "home", map: "ignored" },
        { name: "Boss", map: "escherion", cell: "Boss" },
        { nope: true },
      ]),
    ).toEqual([
      { name: "Home", map: "battleon" },
      { name: "Boss", map: "escherion", cell: "Boss" },
    ]);

    expect(normalizeFastTravels([])).toEqual([]);
    expect(normalizeFastTravels("nope")).toEqual(DEFAULT_FAST_TRAVELS);
  });

  it("adds, updates, and deletes locations predictably", () => {
    const initial: readonly FastTravel[] = [
      { name: "Home", map: "battleon" },
      { name: "Boss", map: "escherion" },
    ];

    expect(addFastTravel(initial, { name: "Dage", map: "Underworld" })).toEqual(
      [
        { name: "Home", map: "battleon" },
        { name: "Boss", map: "escherion" },
        { name: "Dage", map: "underworld" },
      ],
    );
    expect(() =>
      addFastTravel(initial, { name: "home", map: "other" }),
    ).toThrow(FastTravelDuplicateNameError);

    expect(
      updateFastTravel(initial, "home", {
        name: "Spawn",
        map: "Battleon",
      }),
    ).toEqual([
      { name: "Spawn", map: "battleon" },
      { name: "Boss", map: "escherion" },
    ]);
    expect(() =>
      updateFastTravel(initial, "missing", { name: "Other", map: "other" }),
    ).toThrow(FastTravelNotFoundError);
    expect(() =>
      updateFastTravel(initial, "home", { name: "boss", map: "other" }),
    ).toThrow(FastTravelDuplicateNameError);

    expect(deleteFastTravel(initial, "BOSS")).toEqual([
      { name: "Home", map: "battleon" },
    ]);
    expect(() => deleteFastTravel(initial, "missing")).toThrow(
      FastTravelNotFoundError,
    );
  });

  it("normalizes room numbers and warp targets", () => {
    expect(normalizeFastTravelRoomNumber("12")).toBe(12);
    expect(normalizeFastTravelRoomNumber(0)).toBe(1);
    expect(normalizeFastTravelRoomNumber(500_000)).toBe(100_000);
    expect(normalizeFastTravelRoomNumber("nope")).toBeUndefined();

    expect(
      fastTravelMapTarget(
        normalizeFastTravelWarpPayload({
          location: { name: "Home", map: "Battleon" },
          roomNumber: 123,
        }),
      ),
    ).toBe("battleon-123");
    expect(
      fastTravelMapTarget({
        location: { name: "Home", map: "battleon" },
      }),
    ).toBe("battleon");
  });
});
