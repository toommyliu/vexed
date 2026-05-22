import { describe, expect, it, vi } from "vitest";
import type { HotkeyBindings } from "../../../shared/hotkeys";
import { createGameCommands, type GameCommandRuntime } from "./commands";
import type { TopNavOptionItem } from "./topNavOptions";

const noop = vi.fn();

const createRuntime = (
  overrides: Partial<GameCommandRuntime> = {},
): GameCommandRuntime => {
  let autoAttackEnabled = false;
  let followerEnabled = false;

  return {
    bindings: () => [] satisfies HotkeyBindings,
    loadScript: noop,
    startScript: noop,
    stopScript: noop,
    scriptLoaded: () => true,
    scriptRunning: () => false,
    autoAttackEnabled: () => autoAttackEnabled,
    followerEnabled: () => followerEnabled,
    toggleAutoAttack: () => {
      autoAttackEnabled = !autoAttackEnabled;
    },
    toggleFollower: () => {
      followerEnabled = !followerEnabled;
    },
    toggleBank: noop,
    optionItems: () => [],
    openWindow: noop,
    toggleTopNavMenu: noop,
    toggleTopBarVisible: noop,
    ...overrides,
  };
};

const findCommand = (
  runtime: GameCommandRuntime,
  id: ReturnType<typeof createGameCommands>[number]["id"],
) => {
  const command = createGameCommands(runtime).find(
    (command) => command.id === id,
  );

  if (!command) {
    throw new Error(`Missing command ${id}`);
  }

  return command;
};

describe("game commands", () => {
  it("toggles the top nav options menu", () => {
    const toggleTopNavMenu = vi.fn();
    const runtime = createRuntime({ toggleTopNavMenu });

    findCommand(runtime, "toggleOptionsMenu").run();

    expect(toggleTopNavMenu).toHaveBeenCalledWith("options");
  });

  it("toggles top bar visibility", () => {
    const toggleTopBarVisible = vi.fn();
    const runtime = createRuntime({ toggleTopBarVisible });

    findCommand(runtime, "toggleTopBar").run();

    expect(toggleTopBarVisible).toHaveBeenCalledOnce();
  });

  it("toggles auto attack through the runtime action", () => {
    const toggleAutoAttack = vi.fn();
    const runtime = createRuntime({ toggleAutoAttack });

    findCommand(runtime, "toggleAutoattack").run();

    expect(toggleAutoAttack).toHaveBeenCalledOnce();
  });

  it("toggles follower through the runtime action", () => {
    const toggleFollower = vi.fn();
    const runtime = createRuntime({ toggleFollower });

    findCommand(runtime, "toggleFollower").run();

    expect(toggleFollower).toHaveBeenCalledOnce();
  });

  it("opens follower through the window command", () => {
    const openWindow = vi.fn();
    const runtime = createRuntime({ openWindow });

    findCommand(runtime, "openFollower").run();

    expect(openWindow).toHaveBeenCalledWith("follower");
  });

  it("toggles bank through the runtime action", () => {
    const toggleBank = vi.fn();
    const runtime = createRuntime({ toggleBank });

    findCommand(runtime, "toggleBank").run();

    expect(toggleBank).toHaveBeenCalledOnce();
  });

  it("dispatches option commands through top nav option items", () => {
    const onSelect = vi.fn();
    const optionItems = (): readonly TopNavOptionItem[] => [
      {
        id: "lag-killer",
        label: "Lag Killer",
        checked: false,
        onSelect,
      },
    ];
    const runtime = createRuntime({ optionItems });

    const command = findCommand(runtime, "toggleLagKiller");

    expect(command.label()).toBe("Lag Killer");

    command.run();

    expect(onSelect).toHaveBeenCalledOnce();
  });
});
