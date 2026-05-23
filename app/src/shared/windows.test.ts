import { describe, expect, it } from "vitest";
import {
  WindowIds,
  appWindowGroups,
  gameWindowGroups,
  getWindowDefinition,
  isAppWindowDefinition,
  isGameChildWindowDefinition,
  isWindowId,
} from "./windows";

describe("window catalog", () => {
  it("contains the app windows exposed by the native app menu", () => {
    expect(appWindowGroups).toEqual([
      {
        name: "Application",
        items: [
          expect.objectContaining({
            id: WindowIds.AccountManager,
            label: "Account Manager",
            scope: "app",
            closeBehavior: "hide",
            dimensions: {
              width: 966,
              height: 552,
            },
          }),
          expect.objectContaining({
            id: WindowIds.Settings,
            label: "Settings",
            scope: "app",
            closeBehavior: "hide",
            dimensions: {
              width: 651,
              height: 654,
            },
          }),
        ],
      },
    ]);
  });

  it("contains the game and tool windows exposed by the game menu", () => {
    expect(gameWindowGroups).toEqual([
      {
        name: "Tools",
        items: [
          expect.objectContaining({
            id: WindowIds.Skills,
            label: "Skills",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 760,
              height: 560,
              minWidth: 680,
              minHeight: 500,
            },
          }),
          expect.objectContaining({
            id: WindowIds.Environment,
            label: "Environment",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 778,
              height: 593,
            },
          }),
          expect.objectContaining({
            id: WindowIds.Follower,
            label: "Follower",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 648,
              height: 496,
              minWidth: 560,
              minHeight: 420,
            },
          }),
          expect.objectContaining({
            id: WindowIds.LoaderGrabber,
            label: "Loader/grabber",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 600,
              height: 546,
            },
          }),
          expect.objectContaining({
            id: WindowIds.FastTravels,
            label: "Fast travels",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 649,
              height: 527,
            },
          }),
        ],
      },
      {
        name: "Packets",
        items: [
          expect.objectContaining({
            id: WindowIds.Packets,
            label: "Packets",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 760,
              height: 560,
              minWidth: 680,
              minHeight: 500,
            },
          }),
        ],
      },
    ]);
  });

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
