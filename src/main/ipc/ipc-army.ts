import { setTimeout } from "timers";
import type { BrowserWindow } from "electron";
import { ipcMain } from "../../common/ipc";
import { IPC_EVENTS } from "../../common/ipc-events";

// function getPlayerName(browserWindow: BrowserWindow) {}

const map: Map<
  string, // config fileName
  {
    done: Set<string>; // set of players done
    leader: string; // playerName of the leader
    playerList: Set<string>; // set of players
    windows: Map<string, BrowserWindow>; // playerName -> browser window
  }
> = new Map();
const windowToPlayerMap: WeakMap<BrowserWindow, string> = new WeakMap();

// Leader
ipcMain.answerRenderer(IPC_EVENTS.ARMY_INIT, (args, browserWindow) => {
  const { fileName, playerName, players } = args;

  console.log("Army init:", args);

  const windows = new Map<string, BrowserWindow>();
  windows.set(playerName, browserWindow);
  windowToPlayerMap.set(browserWindow, playerName);

  map.set(fileName, {
    windows,
    done: new Set(),
    playerList: new Set(players),
    leader: playerName,
  });

  console.log("Army init done", map);
});

// Follower
ipcMain.answerRenderer(IPC_EVENTS.ARMY_JOIN, async (args, browserWindow) => {
  const { fileName, playerName } = args;

  let tmp = 0;

  while (!map.has(args.fileName)) {
    if (tmp % 20 === 0) {
      console.log("Waiting for leader to initialize army");
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    tmp++;
  }

  const { windows } = map.get(fileName)!;
  windows.set(playerName, browserWindow);
  windowToPlayerMap.set(browserWindow, playerName);

  console.log("Joined army", args);
});

// ipcMain.answerRenderer(IPC_EVENTS.ARMY_START_JOB, (args, browserWindow) => {});

ipcMain.answerRenderer(IPC_EVENTS.ARMY_FINISH_JOB, async (_, browserWindow) => {
  console.log("Army finish job");
  browserWindow.webContents.send(IPC_EVENTS.ARMY_FINISH_JOB);

  const playerName = windowToPlayerMap.get(browserWindow);
  if (!playerName) {
    console.warn("No player name found for browser window");
    return;
  }

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

  let tmp = 0;

  while (doneSet.size !== playerList.size) {
    if (tmp % 20 === 0) {
      console.log(
        `Waiting for all players to finish job: ${Array.from(playerList)
          .filter((player) => !doneSet.has(player))
          .join(", ")} (${doneSet.size}/${playerList.size})`,
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    tmp++;
  }

  console.log("All players are done and ready");

  // All players are done, send ready to all windows
  for (const [_, window] of windows) {
    window.webContents.send(IPC_EVENTS.ARMY_READY);
  }

  // IMPORTANT: Only clear the set after all messages are sent
  doneSet.clear();
});
