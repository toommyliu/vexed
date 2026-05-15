import { describe, expect, it, vi } from "vitest";
import type { Setter } from "solid-js";
import type { HotkeyBindings } from "../../../shared/hotkeys";
import { createGameCommands, type GameCommandRuntime } from "./commands";
import type { TopNavOptionItem } from "./topNavOptions";

const noop = vi.fn();

const createRuntime = (
  overrides: Partial<GameCommandRuntime> = {},
): GameCommandRuntime => {
  let autoAttackEnabled = false;

  const setAutoAttackEnabled: Setter<boolean> = (value) => {
    autoAttackEnabled =
      typeof value === "function" ? value(autoAttackEnabled) : value;
    return autoAttackEnabled;
  };

  return {
    bindings: () => ({}) satisfies HotkeyBindings,
    loadScript: noop,
    startScript: noop,
    stopScript: noop,
    scriptLoaded: () => true,
    scriptRunning: () => false,
    scriptCommandCount: () => 0,
    commandOverlayVisible: () => true,
    setCommandOverlayVisible: noop,
    setAutoAttackEnabled,
    autoAttackEnabled: () => autoAttackEnabled,
    optionItems: () => [],
    openWindow: noop,
    openTopNavMenu: noop,
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
  it("opens the top nav options menu", () => {
    const openTopNavMenu = vi.fn();
    const runtime = createRuntime({ openTopNavMenu });

    findCommand(runtime, "open-options-menu").run();

    expect(openTopNavMenu).toHaveBeenCalledWith("options");
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

    const command = findCommand(runtime, "toggle-lag-killer");

    expect(command.label()).toBe("Lag Killer");

    command.run();

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("toggles the command overlay when commands exist", () => {
    let commandOverlayVisible = true;
    const setCommandOverlayVisible: Setter<boolean> = (value) => {
      commandOverlayVisible =
        typeof value === "function" ? value(commandOverlayVisible) : value;
      return commandOverlayVisible;
    };
    const runtime = createRuntime({
      scriptCommandCount: () => 1,
      commandOverlayVisible: () => commandOverlayVisible,
      setCommandOverlayVisible,
    });

    const command = findCommand(runtime, "toggle-command-overlay");

    expect(command.enabled()).toBe(true);
    expect(command.label()).toBe("Hide Command Overlay");

    command.run();

    expect(commandOverlayVisible).toBe(false);
    expect(command.label()).toBe("Show Command Overlay");
  });

  it("disables the command overlay toggle when no commands exist", () => {
    let commandOverlayVisible = true;
    const setCommandOverlayVisible = vi.fn();
    const runtime = createRuntime({
      scriptCommandCount: () => 0,
      commandOverlayVisible: () => commandOverlayVisible,
      setCommandOverlayVisible,
    });

    const command = findCommand(runtime, "toggle-command-overlay");

    expect(command.enabled()).toBe(false);

    command.run();

    expect(commandOverlayVisible).toBe(true);
    expect(setCommandOverlayVisible).not.toHaveBeenCalled();
  });
});
