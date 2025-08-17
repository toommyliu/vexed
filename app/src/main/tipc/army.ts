import { getRendererHandlers, type tipc } from "@vexed/tipc";
import { sleep } from "@vexed/utils";
import { BrowserWindow } from "electron";
import type { RendererHandlers } from "../tipc";

type PlayerStatus = {
  done: Set<string>;
  leader: string;
  playerList: Set<string>;
  windows: Map<string, BrowserWindow>;
};

const map: Map<string, PlayerStatus> = new Map();
const windowToPlayerMap: WeakMap<BrowserWindow, string> = new WeakMap();

const handleCleanup = (
  browserWindow: BrowserWindow,
  configFileName?: string,
) => {
  const _cleanup = () => {
    if (configFileName) {
      map.delete(configFileName);
      console.log(`Leader disconnected, cleaned up: ${configFileName}`);
    }
  };

  browserWindow.webContents.once("did-finish-load", _cleanup);
  browserWindow.once("close", _cleanup);
};

type TipcInstance = ReturnType<typeof tipc.create>;

export const createArmyTipcRouter = (tipcInstance: TipcInstance) => ({
  init: tipcInstance.procedure
    .input<{
      fileName: string;
      playerName: string;
      players: string[];
    }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const { fileName, playerName, players } = input;

      const windows = new Map<string, BrowserWindow>();
      windows.set(playerName, browserWindow);
      windowToPlayerMap.set(browserWindow, playerName);

      const playerStatus: PlayerStatus = {
        done: new Set<string>(),
        leader: playerName,
        playerList: new Set(players),
        windows,
      };
      map.set(fileName, playerStatus);

      handleCleanup(browserWindow, fileName);
    }),

  join: tipcInstance.procedure
    .input<{
      fileName: string;
      playerName: string;
    }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const { fileName, playerName } = input;
      let iter = 0;

      while (!map.has(fileName)) {
        await sleep(100);
        iter++;
      }

      await sleep(1_000);

      const { windows } = map.get(fileName)!;
      windows.set(playerName, browserWindow);
      windowToPlayerMap.set(browserWindow, playerName);

      handleCleanup(browserWindow);
    }),

  finishJob: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender as any);
    if (!browserWindow) return;

    const playerName = windowToPlayerMap.get(browserWindow);
    if (!playerName) return;

    const fileName = [...map.keys()].find((fileName) =>
      map.get(fileName)?.windows.has(playerName),
    );
    if (!fileName) return;

    const { done: doneSet, windows, playerList, leader } = map.get(fileName)!;
    doneSet.add(playerName);

    if (playerName !== leader) return;

    let iter = 0;

    while (doneSet.size !== playerList.size && map.has(fileName)) {
      await sleep(100);
      iter++;
    }

    if (!map.has(fileName)) return;

    for (const [_, window] of windows) {
      const rendererHandlers = getRendererHandlers<RendererHandlers>(
        window.webContents,
      );
      await rendererHandlers.army.armyReady.invoke();
    }

    doneSet.clear();
  }),
});
