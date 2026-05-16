import { describe, expect, it } from "vitest";
import {
  assertValidArmyConfigName,
  normalizeArmyConfig,
  normalizeArmyConfigName,
  parseArmyConfigCore,
} from "./army";

describe("army config", () => {
  it("normalizes yaml config names", () => {
    expect(normalizeArmyConfigName(" ultras.yaml ")).toBe("ultras");
    expect(normalizeArmyConfigName("ultras.yml")).toBe("ultras");
    expect(assertValidArmyConfigName("daily-ultras.yaml")).toBe("daily-ultras");
  });

  it("rejects path-like config names", () => {
    expect(() => assertValidArmyConfigName("../secret")).toThrow(
      /may only contain/,
    );
  });

  it("parses the fresh yaml shape", () => {
    expect(
      parseArmyConfigCore({
        room: "12345",
        players: ["a", "b", "c"],
      }),
    ).toEqual({
      leader: "a",
      players: ["a", "b", "c"],
      roomNumber: "12345",
    });
  });

  it("honors explicit leaders", () => {
    expect(
      parseArmyConfigCore({
        leader: "b",
        room: 12345,
        players: ["a", "b"],
      }),
    ).toEqual({
      leader: "b",
      players: ["a", "b"],
      roomNumber: "12345",
    });
  });

  it("parses legacy player fields for migration", () => {
    expect(
      normalizeArmyConfig("legacy", {
        PlayerCount: 2,
        RoomNumber: "9999",
        Player1: "Leader",
        Player2: "Alt",
      }),
    ).toMatchObject({
      configName: "legacy",
      leader: "Leader",
      players: ["Leader", "Alt"],
      roomNumber: "9999",
    });
  });

  it("rejects duplicate players", () => {
    expect(() =>
      parseArmyConfigCore({ room: "1", players: ["A", "a"] }),
    ).toThrow(/Duplicate army player/);
  });
});
