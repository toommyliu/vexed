import type { Accessor } from "solid-js";
import {
  GAME_COMMANDS,
  type CommandCategory,
  type GameCommandId,
} from "../../../shared/commands";
import { WindowIds, type WindowId } from "../../../shared/windows";
import {
  readHotkeyBinding,
  type HotkeyBindings,
} from "../../../shared/hotkeys";
import {
  findTopNavOption,
  topNavOptionCommandIds,
  type GameTopNavMenu,
  type TopNavOptionItem,
} from "./topNavOptions";

export interface GameCommandRuntime {
  readonly bindings: Accessor<HotkeyBindings>;
  readonly loadScript: () => void | Promise<void>;
  readonly startScript: () => void;
  readonly stopScript: () => void;
  readonly scriptLoaded: Accessor<boolean>;
  readonly scriptRunning: Accessor<boolean>;
  readonly autoAttackEnabled: Accessor<boolean>;
  readonly followerEnabled: Accessor<boolean>;
  readonly toggleAutoAttack: () => void;
  readonly toggleFollower: () => void;
  readonly toggleBank: () => void;
  readonly optionItems: Accessor<readonly TopNavOptionItem[]>;
  readonly openWindow: (id: WindowId) => void;
  readonly toggleTopNavMenu: (menu: GameTopNavMenu) => void;
  readonly toggleTopBarVisible: () => void;
}

export interface GameCommand {
  readonly id: GameCommandId;
  readonly category: CommandCategory;
  readonly label: Accessor<string>;
  readonly hotkey: Accessor<string>;
  readonly enabled: Accessor<boolean>;
  readonly run: () => void;
}

const windowCommandIds: Partial<Record<GameCommandId, WindowId>> = {
  openEnvironment: WindowIds.Environment,
  openFastTravels: WindowIds.FastTravels,
  openLoaderGrabber: WindowIds.LoaderGrabber,
  openFollower: WindowIds.Follower,
  openPackets: WindowIds.Packets,
};

const findOption = (
  runtime: GameCommandRuntime,
  id: GameCommandId,
): TopNavOptionItem | undefined => {
  return findTopNavOption(runtime.optionItems(), id);
};

const createCommandLabel = (
  runtime: GameCommandRuntime,
  id: GameCommandId,
  fallback: string,
): Accessor<string> => {
  if (id === "toggleScript") {
    return () => (runtime.scriptRunning() ? "Stop Script" : "Start Script");
  }

  if (id === "toggleAutoattack") {
    return () =>
      runtime.autoAttackEnabled() ? "Disable Autoattack" : "Enable Autoattack";
  }

  if (id === "toggleFollower") {
    return () =>
      runtime.followerEnabled()
        ? "Disable Follower Feature"
        : "Enable Follower Feature";
  }

  if (id in topNavOptionCommandIds) {
    return () => findOption(runtime, id)?.label ?? fallback;
  }

  return () => fallback;
};

const createCommandEnabled = (
  runtime: GameCommandRuntime,
  id: GameCommandId,
): Accessor<boolean> => {
  if (id === "toggleScript") {
    return () => runtime.scriptLoaded();
  }

  if (id === "stopScript") {
    return () => runtime.scriptRunning();
  }

  if (id in topNavOptionCommandIds) {
    return () => {
      const option = findOption(runtime, id);
      return option !== undefined && !option.disabled;
    };
  }

  return () => true;
};

const createCommandRunner = (
  runtime: GameCommandRuntime,
  id: GameCommandId,
): (() => void) => {
  if (id === "loadScript") {
    return () => {
      void runtime.loadScript();
    };
  }

  if (id === "toggleScript") {
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

  if (id === "stopScript") {
    return () => {
      if (runtime.scriptRunning()) {
        runtime.stopScript();
      }
    };
  }

  if (id === "toggleAutoattack") {
    return () => {
      runtime.toggleAutoAttack();
    };
  }

  if (id === "toggleFollower") {
    return () => {
      runtime.toggleFollower();
    };
  }

  if (id === "toggleBank") {
    return runtime.toggleBank;
  }

  if (id === "toggleOptionsMenu") {
    return () => runtime.toggleTopNavMenu("options");
  }

  if (id === "toggleTopBar") {
    return runtime.toggleTopBarVisible;
  }

  const windowId = windowCommandIds[id];
  if (windowId) {
    return () => runtime.openWindow(windowId);
  }

  if (id in topNavOptionCommandIds) {
    return () => {
      const option = findOption(runtime, id);
      if (!option || option.disabled) {
        return;
      }
      option.onSelect();
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
      hotkey: () => readHotkeyBinding(runtime.bindings(), definition.id),
      enabled,
      run: () => {
        if (enabled()) {
          run();
        }
      },
    };
  });
