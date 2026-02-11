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

export type UiActionId = HotkeyId | "open-hotkeys";

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

export const actionHandlers = {
  "toggle-autoattack": () => {
    gameState.autoAttackEnabled = !gameState.autoAttackEnabled;
  },
  "toggle-bank": toggleBank,
  "toggle-top-bar": () => {
    gameState.topNavVisible = !gameState.topNavVisible;
  },
  "load-script": loadScript,
  "toggle-script": toggleScript,
  "toggle-command-overlay": () => {
    commandOverlayState.toggle();
  },
  "toggle-dev-tools": () => {
    void client.scripts.toggleDevTools();
  },
  "open-fast-travels": () => openWindow(WindowIds.FastTravels),
  "open-environment": () => openWindow(WindowIds.Environment),
  "open-hotkeys": () => openWindow(WindowIds.Hotkeys),
  "open-loader-grabber": () => openWindow(WindowIds.LoaderGrabber),
  "open-follower": () => openWindow(WindowIds.Follower),
  "open-packet-logger": () => openWindow(WindowIds.PacketLogger),
  "open-packet-spammer": () => openWindow(WindowIds.PacketSpammer),
  "toggle-options-panel": () => {
    optionsPanelState.toggle();
  },
  "toggle-infinite-range": () => {
    gameState.infiniteRange = !gameState.infiniteRange;
  },
  "toggle-provoke-cell": () => {
    gameState.provokeCell = !gameState.provokeCell;
  },
  "toggle-enemy-magnet": () => {
    gameState.enemyMagnet = !gameState.enemyMagnet;
  },
  "toggle-lag-killer": () => {
    gameState.lagKiller = !gameState.lagKiller;
  },
  "toggle-hide-players": () => {
    gameState.hidePlayers = !gameState.hidePlayers;
  },
  "toggle-skip-cutscenes": () => {
    gameState.skipCutscenes = !gameState.skipCutscenes;
  },
  "toggle-disable-fx": () => {
    gameState.disableFx = !gameState.disableFx;
  },
  "toggle-disable-collisions": () => {
    gameState.disableCollisions = !gameState.disableCollisions;
  },
  "toggle-anti-counter": () => {
    gameState.counterAttack = !gameState.counterAttack;
  },
  "toggle-disable-death-ads": () => {
    gameState.disableDeathAds = !gameState.disableDeathAds;
  },
} satisfies Record<UiActionId, () => void>;

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
  return [
    {
      id: "load-script",
      label: "Load Script",
      category: "Scripts",
      hotkey: resolveHotkey(hotkeyValues, "load-script"),
      run: () => executeAction("load-script"),
    },
    {
      id: "toggle-script",
      label: scriptState.isRunning ? "Stop Script" : "Start Script",
      category: "Scripts",
      hotkey: resolveHotkey(hotkeyValues, "toggle-script"),
      run: () => executeAction("toggle-script"),
    },
    {
      id: "toggle-command-overlay",
      label: "Toggle Command Overlay",
      category: "Scripts",
      hotkey: resolveHotkey(hotkeyValues, "toggle-command-overlay"),
      run: () => executeAction("toggle-command-overlay"),
    },
    {
      id: "toggle-dev-tools",
      label: "Toggle Dev Tools",
      category: "Scripts",
      hotkey: resolveHotkey(hotkeyValues, "toggle-dev-tools"),
      run: () => executeAction("toggle-dev-tools"),
    },
    {
      id: "open-environment",
      label: "Environment",
      category: "Application",
      hotkey: resolveHotkey(hotkeyValues, "open-environment"),
      run: () => executeAction("open-environment"),
    },
    {
      id: "open-hotkeys",
      label: "Hotkeys",
      category: "Application",
      hotkey: "",
      run: () => executeAction("open-hotkeys"),
    },
    {
      id: "open-fast-travels",
      label: "Fast Travels",
      category: "Tools",
      hotkey: resolveHotkey(hotkeyValues, "open-fast-travels"),
      run: () => executeAction("open-fast-travels"),
    },
    {
      id: "open-loader-grabber",
      label: "Loader/Grabber",
      category: "Tools",
      hotkey: resolveHotkey(hotkeyValues, "open-loader-grabber"),
      run: () => executeAction("open-loader-grabber"),
    },
    {
      id: "open-follower",
      label: "Follower",
      category: "Tools",
      hotkey: resolveHotkey(hotkeyValues, "open-follower"),
      run: () => executeAction("open-follower"),
    },
    {
      id: "open-packet-logger",
      label: "Packet Logger",
      category: "Packets",
      hotkey: resolveHotkey(hotkeyValues, "open-packet-logger"),
      run: () => executeAction("open-packet-logger"),
    },
    {
      id: "open-packet-spammer",
      label: "Packet Spammer",
      category: "Packets",
      hotkey: resolveHotkey(hotkeyValues, "open-packet-spammer"),
      run: () => executeAction("open-packet-spammer"),
    },
    {
      id: "toggle-infinite-range",
      label: gameState.infiniteRange
        ? "Disable Infinite Range"
        : "Enable Infinite Range",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-infinite-range"),
      run: () => executeAction("toggle-infinite-range"),
    },
    {
      id: "toggle-provoke-cell",
      label: gameState.provokeCell
        ? "Disable Provoke Cell"
        : "Enable Provoke Cell",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-provoke-cell"),
      run: () => executeAction("toggle-provoke-cell"),
    },
    {
      id: "toggle-enemy-magnet",
      label: gameState.enemyMagnet
        ? "Disable Enemy Magnet"
        : "Enable Enemy Magnet",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-enemy-magnet"),
      run: () => executeAction("toggle-enemy-magnet"),
    },
    {
      id: "toggle-lag-killer",
      label: gameState.lagKiller ? "Disable Lag Killer" : "Enable Lag Killer",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-lag-killer"),
      run: () => executeAction("toggle-lag-killer"),
    },
    {
      id: "toggle-hide-players",
      label: gameState.hidePlayers
        ? "Disable Hide Players"
        : "Enable Hide Players",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-hide-players"),
      run: () => executeAction("toggle-hide-players"),
    },
    {
      id: "toggle-skip-cutscenes",
      label: gameState.skipCutscenes
        ? "Disable Skip Cutscenes"
        : "Enable Skip Cutscenes",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-skip-cutscenes"),
      run: () => executeAction("toggle-skip-cutscenes"),
    },
    {
      id: "toggle-disable-fx",
      label: gameState.disableFx ? "Enable FX" : "Disable FX",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-disable-fx"),
      run: () => executeAction("toggle-disable-fx"),
    },
    {
      id: "toggle-disable-collisions",
      label: gameState.disableCollisions
        ? "Enable Collisions"
        : "Disable Collisions",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-disable-collisions"),
      run: () => executeAction("toggle-disable-collisions"),
    },
    {
      id: "toggle-anti-counter",
      label: gameState.counterAttack
        ? "Disable Anti-Counter"
        : "Enable Anti-Counter",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-anti-counter"),
      run: () => executeAction("toggle-anti-counter"),
    },
    {
      id: "toggle-disable-death-ads",
      label: gameState.disableDeathAds
        ? "Enable Death Ads"
        : "Disable Death Ads",
      category: "Options",
      hotkey: resolveHotkey(hotkeyValues, "toggle-disable-death-ads"),
      run: () => executeAction("toggle-disable-death-ads"),
    },
  ];
}
