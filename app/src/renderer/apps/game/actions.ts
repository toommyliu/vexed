import { client } from "~/shared/tipc";
import { WindowIds } from "~/shared/types";
import {
  gameState,
  commandOverlayState,
  optionsPanelState,
} from "./state/index.svelte";

// TODO: refactor CommandPalette
// improve impl

export const actions = {
  toggleAutoattack: () => {
    window.dispatchEvent(new CustomEvent("hotkey:toggle-autoattack"));
  },

  toggleBank: () => {
    window.dispatchEvent(new CustomEvent("hotkey:toggle-bank"));
  },

  toggleTopBar: () => {
    window.dispatchEvent(new CustomEvent("hotkey:toggle-top-bar"));
  },

  loadScript: () => {
    void client.scripts.loadScript({ scriptPath: "" });
  },

  toggleScript: () => {
    window.dispatchEvent(new CustomEvent("hotkey:toggle-script"));
  },

  toggleCommandOverlay: () => {
    commandOverlayState.toggle();
  },

  toggleDevTools: () => {
    void client.scripts.toggleDevTools();
  },

  openFastTravels: () => {
    void client.game.launchWindow(WindowIds.FastTravels);
  },

  openEnvironment: () => {
    void client.game.launchWindow(WindowIds.Environment);
  },

  openLoaderGrabber: () => {
    void client.game.launchWindow(WindowIds.LoaderGrabber);
  },

  openFollower: () => {
    void client.game.launchWindow(WindowIds.Follower);
  },

  openPacketLogger: () => {
    void client.game.launchWindow(WindowIds.PacketLogger);
  },

  openPacketSpammer: () => {
    void client.game.launchWindow(WindowIds.PacketSpammer);
  },

  toggleOptionsPanel: () => {
    optionsPanelState.toggle();
  },

  toggleInfiniteRange: () => {
    gameState.infiniteRange = !gameState.infiniteRange;
  },

  toggleProvokeCell: () => {
    gameState.provokeCell = !gameState.provokeCell;
  },

  toggleEnemyMagnet: () => {
    gameState.enemyMagnet = !gameState.enemyMagnet;
  },

  toggleLagKiller: () => {
    gameState.lagKiller = !gameState.lagKiller;
  },

  toggleHidePlayers: () => {
    gameState.hidePlayers = !gameState.hidePlayers;
  },

  toggleSkipCutscenes: () => {
    gameState.skipCutscenes = !gameState.skipCutscenes;
  },

  toggleDisableFx: () => {
    gameState.disableFx = !gameState.disableFx;
  },

  toggleDisableCollisions: () => {
    gameState.disableCollisions = !gameState.disableCollisions;
  },

  toggleAntiCounter: () => {
    gameState.counterAttack = !gameState.counterAttack;
  },

  toggleDisableDeathAds: () => {
    gameState.disableDeathAds = !gameState.disableDeathAds;
  },
} as const;

export const actionHandlers: Record<string, () => void> = {
  "toggle-autoattack": actions.toggleAutoattack,
  "toggle-bank": actions.toggleBank,
  "toggle-top-bar": actions.toggleTopBar,
  "load-script": actions.loadScript,
  "toggle-script": actions.toggleScript,
  "toggle-command-overlay": actions.toggleCommandOverlay,
  "toggle-dev-tools": actions.toggleDevTools,
  "open-fast-travels": actions.openFastTravels,
  "open-environment": actions.openEnvironment,
  "open-loadergrabber": actions.openLoaderGrabber,
  "open-follower": actions.openFollower,
  "open-packet-logger": actions.openPacketLogger,
  "open-packet-spammer": actions.openPacketSpammer,
  "toggle-options-panel": actions.toggleOptionsPanel,
  "toggle-infinite-range": actions.toggleInfiniteRange,
  "toggle-provoke-cell": actions.toggleProvokeCell,
  "toggle-enemy-magnet": actions.toggleEnemyMagnet,
  "toggle-lag-killer": actions.toggleLagKiller,
  "toggle-hide-players": actions.toggleHidePlayers,
  "toggle-skip-cutscenes": actions.toggleSkipCutscenes,
  "toggle-disable-fx": actions.toggleDisableFx,
  "toggle-disable-collisions": actions.toggleDisableCollisions,
  "toggle-anti-counter": actions.toggleAntiCounter,
  "toggle-disable-death-ads": actions.toggleDisableDeathAds,
};

export function executeAction(actionId: string): void {
  const handler = actionHandlers[actionId];
  if (handler) handler();
}
