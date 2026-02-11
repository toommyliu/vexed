import type { HotkeyId } from "~/shared/hotkeys/schema";
import { client } from "~/shared/tipc";
import { WindowIds } from "~/shared/types";
import { Bot } from "./lib/Bot";
import {
  gameState,
  commandOverlayState,
  optionsPanelState,
  scriptState,
} from "./state/index.svelte";

const bot = Bot.getInstance();

// Action Ids with no supported keybind
export type NonBindableActionIds = "open-hotkeys";
export type UiActionId = HotkeyId | NonBindableActionIds;

export type UiCommandCategory =
  | "Application"
  | "Options"
  | "Packets"
  | "Scripts"
  | "Tools";

export type UiCommandSpec = {
  category: UiCommandCategory;
  hotkey: string;
  id: UiActionId;
  label: string;
  run(): void;
};

type UiCommandDef = {
  category: UiCommandCategory;
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  handler: () => void;
  hotkeyId?: HotkeyId;
  id: UiActionId;
  label: string | (() => string);
  showInUi?: boolean;
};

function openWindow(windowId: WindowIds): void {
  void client.app.launchWindow(windowId);
}

export function loadScript(): void {
  void client.scripts.loadScript({ scriptPath: "" });
}

export function startScript(): void {
  if (!window.context.commands.length || window.context.isRunning()) return;
  window.context.removeAllListeners("end");
  const onEnd = () => {
    scriptState.isRunning = false;
    window.context.removeListener("end", onEnd);
  };

  void window.context.start();
  scriptState.isRunning = true;
  window.context.on("end", onEnd);
}

export function stopScript(): void {
  if (!window.context.isRunning()) return;
  void window.context.stop();
  scriptState.isRunning = false;
}

export function toggleScript(): void {
  if (!scriptState.isLoaded) return;
  if (scriptState.isRunning) {
    stopScript();
  } else {
    startScript();
  }
}

function toggleBank(): void {
  if (!bot.player.isReady()) return;
  if (bot.bank.isOpen()) {
    bot.flash.call(() => swf.bankOpen());
  } else {
    void bot.bank.open();
  }
}

const COMMANDS: UiCommandDef[] = [
  {
    id: "load-script",
    label: "Load Script",
    category: "Scripts",
    hotkeyId: "load-script",
    handler: loadScript,
  },
  {
    id: "toggle-script",
    label: () => (scriptState.isRunning ? "Stop Script" : "Start Script"),
    category: "Scripts",
    hotkeyId: "toggle-script",
    handler: toggleScript,
  },
  {
    id: "toggle-command-overlay",
    label: "Toggle Command Overlay",
    category: "Scripts",
    hotkeyId: "toggle-command-overlay",
    handler: () => {
      commandOverlayState.toggle();
    },
  },
  {
    id: "toggle-dev-tools",
    label: "Toggle Dev Tools",
    category: "Scripts",
    hotkeyId: "toggle-dev-tools",
    handler: () => {
      void client.scripts.toggleDevTools();
    },
  },
  {
    id: "open-environment",
    label: "Environment",
    category: "Application",
    hotkeyId: "open-environment",
    handler: () => openWindow(WindowIds.Environment),
  },
  {
    id: "open-hotkeys",
    label: "Hotkeys",
    category: "Application",
    handler: () => openWindow(WindowIds.Hotkeys),
  },
  {
    id: "open-fast-travels",
    label: "Fast Travels",
    category: "Tools",
    hotkeyId: "open-fast-travels",
    handler: () => openWindow(WindowIds.FastTravels),
  },
  {
    id: "open-loader-grabber",
    label: "Loader/Grabber",
    category: "Tools",
    hotkeyId: "open-loader-grabber",
    handler: () => openWindow(WindowIds.LoaderGrabber),
  },
  {
    id: "open-follower",
    label: "Follower",
    category: "Tools",
    hotkeyId: "open-follower",
    handler: () => openWindow(WindowIds.Follower),
  },
  {
    id: "open-packet-logger",
    label: "Packet Logger",
    category: "Packets",
    hotkeyId: "open-packet-logger",
    handler: () => openWindow(WindowIds.PacketLogger),
  },
  {
    id: "open-packet-spammer",
    label: "Packet Spammer",
    category: "Packets",
    hotkeyId: "open-packet-spammer",
    handler: () => openWindow(WindowIds.PacketSpammer),
  },
  {
    id: "toggle-options-panel",
    label: "Toggle Options Panel",
    category: "Options",
    hotkeyId: "toggle-options-panel",
    showInUi: false,
    handler: () => {
      optionsPanelState.toggle();
    },
  },
  {
    id: "toggle-autoattack",
    label: () =>
      gameState.autoAttackEnabled ? "Disable Autoattack" : "Enable Autoattack",
    category: "Options",
    hotkeyId: "toggle-autoattack",
    showInUi: false,
    handler: () => {
      gameState.autoAttackEnabled = !gameState.autoAttackEnabled;
    },
  },
  {
    id: "toggle-top-bar",
    label: () => (gameState.topNavVisible ? "Hide Top Bar" : "Show Top Bar"),
    category: "Options",
    hotkeyId: "toggle-top-bar",
    showInUi: false,
    handler: () => {
      gameState.topNavVisible = !gameState.topNavVisible;
    },
  },
  {
    id: "toggle-bank",
    label: "Toggle Bank",
    category: "Options",
    hotkeyId: "toggle-bank",
    showInUi: false,
    handler: toggleBank,
  },
  {
    id: "toggle-infinite-range",
    label: () =>
      gameState.infiniteRange
        ? "Disable Infinite Range"
        : "Enable Infinite Range",
    category: "Options",
    hotkeyId: "toggle-infinite-range",
    handler: () => {
      gameState.infiniteRange = !gameState.infiniteRange;
    },
  },
  {
    id: "toggle-provoke-cell",
    label: () =>
      gameState.provokeCell ? "Disable Provoke Cell" : "Enable Provoke Cell",
    category: "Options",
    hotkeyId: "toggle-provoke-cell",
    handler: () => {
      gameState.provokeCell = !gameState.provokeCell;
    },
  },
  {
    id: "toggle-enemy-magnet",
    label: () =>
      gameState.enemyMagnet ? "Disable Enemy Magnet" : "Enable Enemy Magnet",
    category: "Options",
    hotkeyId: "toggle-enemy-magnet",
    handler: () => {
      gameState.enemyMagnet = !gameState.enemyMagnet;
    },
  },
  {
    id: "toggle-lag-killer",
    label: () =>
      gameState.lagKiller ? "Disable Lag Killer" : "Enable Lag Killer",
    category: "Options",
    hotkeyId: "toggle-lag-killer",
    handler: () => {
      gameState.lagKiller = !gameState.lagKiller;
    },
  },
  {
    id: "toggle-hide-players",
    label: () =>
      gameState.hidePlayers ? "Disable Hide Players" : "Enable Hide Players",
    category: "Options",
    hotkeyId: "toggle-hide-players",
    handler: () => {
      gameState.hidePlayers = !gameState.hidePlayers;
    },
  },
  {
    id: "toggle-skip-cutscenes",
    label: () =>
      gameState.skipCutscenes
        ? "Disable Skip Cutscenes"
        : "Enable Skip Cutscenes",
    category: "Options",
    hotkeyId: "toggle-skip-cutscenes",
    handler: () => {
      gameState.skipCutscenes = !gameState.skipCutscenes;
    },
  },
  {
    id: "toggle-disable-fx",
    label: () => (gameState.disableFx ? "Enable FX" : "Disable FX"),
    category: "Options",
    hotkeyId: "toggle-disable-fx",
    handler: () => {
      gameState.disableFx = !gameState.disableFx;
    },
  },
  {
    id: "toggle-disable-collisions",
    label: () =>
      gameState.disableCollisions ? "Enable Collisions" : "Disable Collisions",
    category: "Options",
    hotkeyId: "toggle-disable-collisions",
    handler: () => {
      gameState.disableCollisions = !gameState.disableCollisions;
    },
  },
  {
    id: "toggle-anti-counter",
    label: () =>
      gameState.counterAttack ? "Disable Anti-Counter" : "Enable Anti-Counter",
    category: "Options",
    hotkeyId: "toggle-anti-counter",
    handler: () => {
      gameState.counterAttack = !gameState.counterAttack;
    },
  },
  {
    id: "toggle-disable-death-ads",
    label: () =>
      gameState.disableDeathAds ? "Enable Death Ads" : "Disable Death Ads",
    category: "Options",
    hotkeyId: "toggle-disable-death-ads",
    handler: () => {
      gameState.disableDeathAds = !gameState.disableDeathAds;
    },
  },
];

export const actionHandlers = COMMANDS.reduce(
  (acc, command) => {
    acc[command.id] = command.handler;
    return acc;
  },
  {} as Record<UiActionId, () => void>,
);

export function executeAction(actionId: UiActionId | string): void {
  const handler = actionHandlers[actionId as UiActionId];
  if (handler) handler();
  else console.warn(`Unknown action id: ${actionId}`);
}

function resolveHotkey(
  hotkeyValues: Record<string, string>,
  id?: HotkeyId,
): string {
  if (!id) return "";
  return hotkeyValues[id] ?? "";
}

export function getUiCommands(
  hotkeyValues: Record<string, string> = {},
): UiCommandSpec[] {
  return COMMANDS.map((command) => ({
    id: command.id,
    label:
      typeof command.label === "function" ? command.label() : command.label,
    category: command.category,
    hotkey: resolveHotkey(hotkeyValues, command.hotkeyId),
    run: () => executeAction(command.id),
  }));
}
