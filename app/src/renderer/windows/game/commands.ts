import type { Accessor, Setter } from "solid-js";
import {
  GAME_COMMANDS,
  type CommandCategory,
  type GameCommandId,
} from "../../../shared/commands";
import { WindowIds, type WindowId } from "../../../shared/windows";
import type { HotkeyBindings } from "../../../shared/hotkeys";
import type { TopNavOptionItem } from "./GameTopNav";

export interface GameCommandRuntime {
  readonly bindings: Accessor<HotkeyBindings>;
  readonly loadScript: () => void | Promise<void>;
  readonly startScript: () => void;
  readonly stopScript: () => void;
  readonly scriptLoaded: Accessor<boolean>;
  readonly scriptRunning: Accessor<boolean>;
  readonly setAutoAttackEnabled: Setter<boolean>;
  readonly autoAttackEnabled: Accessor<boolean>;
  readonly optionItems: Accessor<readonly TopNavOptionItem[]>;
  readonly openWindow: (id: WindowId) => void;
}

export interface GameCommand {
  readonly id: GameCommandId;
  readonly category: CommandCategory;
  readonly label: Accessor<string>;
  readonly keywords: readonly string[];
  readonly hotkey: Accessor<string>;
  readonly enabled: Accessor<boolean>;
  readonly run: () => void;
}

const optionCommandIds: Partial<Record<GameCommandId, string>> = {
  "toggle-infinite-range": "infinite-range",
  "toggle-provoke-cell": "provoke-cell",
  "toggle-enemy-magnet": "enemy-magnet",
  "toggle-lag-killer": "lag-killer",
  "toggle-hide-players": "hide-players",
  "toggle-skip-cutscenes": "skip-cutscenes",
  "toggle-disable-fx": "disable-fx",
  "toggle-collisions": "collisions",
  "toggle-death-ads": "death-ads",
};

const windowCommandIds: Partial<Record<GameCommandId, WindowId>> = {
  "open-environment": WindowIds.Environment,
  "open-fast-travels": WindowIds.FastTravels,
  "open-loader-grabber": WindowIds.LoaderGrabber,
  "open-follower": WindowIds.Follower,
  "open-packet-logger": WindowIds.PacketLogger,
  "open-packet-spammer": WindowIds.PacketSpammer,
};

const findOption = (
  runtime: GameCommandRuntime,
  id: GameCommandId,
): TopNavOptionItem | undefined => {
  const optionId = optionCommandIds[id];
  return optionId
    ? runtime.optionItems().find((option) => option.id === optionId)
    : undefined;
};

const createCommandLabel = (
  runtime: GameCommandRuntime,
  id: GameCommandId,
  fallback: string,
): Accessor<string> => {
  if (id === "toggle-script") {
    return () => (runtime.scriptRunning() ? "Stop Script" : "Start Script");
  }

  if (id === "toggle-autoattack") {
    return () =>
      runtime.autoAttackEnabled() ? "Disable Autoattack" : "Enable Autoattack";
  }

  if (id in optionCommandIds) {
    return () => findOption(runtime, id)?.label ?? fallback;
  }

  return () => fallback;
};

const createCommandEnabled = (
  runtime: GameCommandRuntime,
  id: GameCommandId,
): Accessor<boolean> => {
  if (id === "toggle-script") {
    return () => runtime.scriptLoaded();
  }

  if (id === "stop-script") {
    return () => runtime.scriptRunning();
  }

  return () => true;
};

const createCommandRunner = (
  runtime: GameCommandRuntime,
  id: GameCommandId,
): (() => void) => {
  if (id === "load-script") {
    return () => {
      void runtime.loadScript();
    };
  }

  if (id === "toggle-script") {
    return () => {
      if (!runtime.scriptLoaded()) {
        return;
      }

      if (runtime.scriptRunning()) {
        runtime.stopScript();
      } else {
        runtime.startScript();
      }
    };
  }

  if (id === "stop-script") {
    return () => {
      if (runtime.scriptRunning()) {
        runtime.stopScript();
      }
    };
  }

  if (id === "toggle-autoattack") {
    return () => {
      runtime.setAutoAttackEnabled((enabled) => !enabled);
    };
  }

  const windowId = windowCommandIds[id];
  if (windowId) {
    return () => runtime.openWindow(windowId);
  }

  if (id in optionCommandIds) {
    return () => {
      findOption(runtime, id)?.onSelect();
    };
  }

  return () => {};
};

export const createGameCommands = (
  runtime: GameCommandRuntime,
): readonly GameCommand[] =>
  GAME_COMMANDS.map((definition) => {
    const enabled = createCommandEnabled(runtime, definition.id);
    const run = createCommandRunner(runtime, definition.id);

    return {
      id: definition.id,
      category: definition.category,
      label: createCommandLabel(runtime, definition.id, definition.label),
      keywords: definition.keywords,
      hotkey: () =>
        runtime.bindings()[definition.id] ?? definition.defaultHotkey,
      enabled,
      run: () => {
        if (enabled()) {
          run();
        }
      },
    };
  });
