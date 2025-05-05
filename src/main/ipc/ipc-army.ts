import { setTimeout } from "timers";
import type { BrowserWindow } from "electron";
import { ipcMain } from "../../common/ipc";
import { IPC_EVENTS } from "../../common/ipc-events";

type PlayerStatus = {
  done: Set<string>; // set of players done
  leader: string; // playerName of the leader
  playerList: Set<string>; // set of playerName, including leader
  windows: Map<string, BrowserWindow>; // playerName -> browser window
};
const map: Map<
  string, // config fileName
  PlayerStatus
> = new Map();
const windowToPlayerMap: WeakMap<BrowserWindow, string> = new WeakMap();

// function getPlayerName(browserWindow: BrowserWindow) {}

// Cleanup map to get a clean state (useful for testing when reloading the window)
const handleCleanup = (
  browserWindow: BrowserWindow,
  configFileName?: string,
) => {
  // only useful for Leader?
  const _cleanup = () => {
    if (configFileName) {
      map.delete(configFileName);
      console.log(`Leader disconnected, cleaned up: ${configFileName}`);
    }
  };

  browserWindow.webContents.once("did-finish-load", _cleanup);
  browserWindow.once("close", _cleanup);
};

const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// Leader
ipcMain.answerRenderer(IPC_EVENTS.ARMY_INIT, (args, browserWindow) => {
  const { fileName, playerName, players } = args;

  console.log("Army init:", args);

  const windows = new Map<string, BrowserWindow>();
  windows.set(playerName, browserWindow);
  windowToPlayerMap.set(browserWindow, playerName);

  const playerStatus = {
    done: new Set<string>(),
    leader: playerName,
    playerList: new Set(players),
    windows,
  };
  map.set(fileName, playerStatus);

  handleCleanup(browserWindow, fileName);

  console.log("Army init done", map);
});

// Follower
ipcMain.answerRenderer(IPC_EVENTS.ARMY_JOIN, async (args, browserWindow) => {
  const { fileName, playerName } = args;

  let iter = 0;

  while (!map.has(args.fileName)) {
    if (iter % 100 === 0) {
      console.log(`${playerName} waiting for army init...`);
    }

    await sleep(100);
    iter++;
  }

  await sleep(1_000);

  const { windows } = map.get(fileName)!;
  windows.set(playerName, browserWindow);
  windowToPlayerMap.set(browserWindow, playerName);

  handleCleanup(browserWindow);

  console.log("Joined army", args);
});

// ipcMain.answerRenderer(IPC_EVENTS.ARMY_START_JOB, (args, browserWindow) => {});

ipcMain.answerRenderer(IPC_EVENTS.ARMY_FINISH_JOB, async (_, browserWindow) => {
  // browserWindow.webContents.send(IPC_EVENTS.ARMY_FINISH_JOB);

  const playerName = windowToPlayerMap.get(browserWindow);
  if (!playerName) {
    console.warn("No player name found for browser window");
    return;
  }

  console.log(`Player ${playerName} finished job`);

  // Update the map to mark this player as done
  const fileName = [...map.keys()].find((fileName) =>
    map.get(fileName)?.windows.has(playerName),
  );
  if (!fileName) {
    console.warn("No file name found for browser window");
    return;
  }

  const { done: doneSet, windows, playerList, leader } = map.get(fileName)!;
  doneSet.add(playerName);
  console.log(`Player ${playerName} is done`);

  if (playerName !== leader) {
    console.log("Not leader, waiting for leader to finish job");
    return;
  }

  let iter = 0;

  while (doneSet.size !== playerList.size) {
    if (iter % 100 === 0) {
      console.log(
        `Leader: Waiting for all players to finish job: ${Array.from(playerList)
          .filter((player) => !doneSet.has(player))
          .join(", ")} (${doneSet.size}/${playerList.size})`,
      );
    }

    await sleep(100);

    iter++;
  }

  console.log("All players are done and ready");

  // All players are done, send ready to all windows
  for (const [_, window] of windows) {
    window.webContents.send(IPC_EVENTS.ARMY_READY);
  }

  // IMPORTANT: Only clear the set after all messages are sent
  doneSet.clear();
});
