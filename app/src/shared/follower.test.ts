import { expect, test } from "vitest";
import { DEFAULT_COMBAT_PROFILE_ID } from "./combat-profiles";
import {
  normalizeFollowerConfig,
  normalizeFollowerState,
  splitFollowerAttackPriority,
  splitFollowerLocationFallbacks,
} from "./follower";

test("normalizes follower config", () => {
  expect(
    normalizeFollowerConfig({
      targetName: "  SomePlayer ",
      combatEnabled: false,
      copyWalk: false,
      retryEnabled: false,
      maxAttempts: 5.8,
      selectedProfileId: "  legion-revenant ",
      attackPriority: "Defense Drone, 2, defense drone, ,Attack Drone",
      lockedZoneFallbacks:
        "ultradage-12345,Enter,Spawn\n ultranulgath-98765,Boss,Left ",
      lockedZoneRoomOverride: "  12345 ",
    }),
  ).toEqual({
    targetName: "someplayer",
    combatEnabled: false,
    copyWalk: false,
    retryEnabled: false,
    maxAttempts: 5,
    selectedProfileId: "legion-revenant",
    attackPriority: ["Defense Drone", 2, "Attack Drone"],
    lockedZoneFallbacks: [
      { map: "ultradage-12345", cell: "Enter", pad: "Spawn" },
      { map: "ultranulgath-98765", cell: "Boss", pad: "Left" },
    ],
    lockedZoneRoomOverride: "12345",
  });
});

test("defaults follower config to generic profile without copy walk", () => {
  expect(
    normalizeFollowerConfig({
      targetName: "Target",
    }),
  ).toEqual({
    targetName: "target",
    combatEnabled: true,
    copyWalk: false,
    retryEnabled: true,
    maxAttempts: 3,
    selectedProfileId: DEFAULT_COMBAT_PROFILE_ID,
    attackPriority: [],
    lockedZoneFallbacks: [],
    lockedZoneRoomOverride: "",
  });
});

test("parses attack priority arrays and removes invalid entries", () => {
  expect(
    splitFollowerAttackPriority([" 1 ", 1, 0, -1, "Wolf", "", "wolf"]),
  ).toEqual([1, "Wolf"]);
});

test("parses locked-zone fallback locations", () => {
  expect(
    splitFollowerLocationFallbacks([
      { map: " ultradage-12345 ", cell: " Enter ", pad: " Spawn " },
      { map: "ultradage-12345", cell: "Enter", pad: "Spawn" },
      { map: "" },
      { map: "ultradrago-22222" },
    ]),
  ).toEqual([
    { map: "ultradage-12345", cell: "Enter", pad: "Spawn" },
    { map: "ultradrago-22222" },
  ]);
});

test("normalizes follower state with stopped errors", () => {
  expect(
    normalizeFollowerState({
      enabled: false,
      running: false,
      targetName: " HERO ",
      profileId: "generic-base",
      profileLabel: "Generic",
      phase: "stopped",
      attemptsRemaining: 0.8,
      lastError: "Could not find hero",
      stoppedReason: "Target not found",
    }),
  ).toEqual({
    enabled: false,
    running: false,
    targetName: "hero",
    profileId: "generic-base",
    profileLabel: "Generic",
    phase: "stopped",
    attemptsRemaining: 0,
    lastError: "Could not find hero",
    stoppedReason: "Target not found",
  });
});

test("invalid follower state falls back to idle", () => {
  expect(normalizeFollowerState(null)).toEqual({
    enabled: false,
    running: false,
    targetName: "",
    phase: "idle",
    attemptsRemaining: 3,
  });
});
