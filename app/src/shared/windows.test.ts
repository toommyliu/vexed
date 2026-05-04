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
        name: "Application",
        items: [
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
            id: WindowIds.Hotkeys,
            label: "Hotkeys",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 517,
              height: 528,
            },
          }),
        ],
      },
      {
        name: "Tools",
        items: [
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
            id: WindowIds.Follower,
            label: "Follower",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 648,
              height: 496,
            },
          }),
        ],
      },
      {
        name: "Packets",
        items: [
          expect.objectContaining({
            id: WindowIds.PacketLogger,
            label: "Logger",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 643,
              height: 534,
            },
          }),
          expect.objectContaining({
            id: WindowIds.PacketSpammer,
            label: "Spammer",
            scope: "game-child",
            closeBehavior: "hide",
            dimensions: {
              width: 641,
              height: 542,
            },
          }),
        ],
      },
    ]);
  });

  it("validates and resolves window ids", () => {
    expect(isWindowId(WindowIds.Environment)).toBe(true);
    expect(isWindowId("not-a-window")).toBe(false);
    expect(getWindowDefinition(WindowIds.PacketSpammer)).toEqual(
      expect.objectContaining({
        id: WindowIds.PacketSpammer,
        label: "Spammer",
      }),
    );
  });

  it("classifies app and game-child window definitions", () => {
    const settings = getWindowDefinition(WindowIds.Settings);
    const environment = getWindowDefinition(WindowIds.Environment);
    const packetLogger = getWindowDefinition(WindowIds.PacketLogger);

    expect(settings && isAppWindowDefinition(settings)).toBe(true);
    expect(environment && isGameChildWindowDefinition(environment)).toBe(true);
    expect(packetLogger && isGameChildWindowDefinition(packetLogger)).toBe(true);
  });
});
