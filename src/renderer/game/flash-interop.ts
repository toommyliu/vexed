import process from "process";
import { ipcRenderer } from "../../common/ipc";
import { IPC_EVENTS } from "../../common/ipc-events";
import { Logger } from "../../common/logger";
import { Bot } from "./lib/Bot";
import { addGoldExp } from "./networking/json/add-gold-exp";
import { ct } from "./networking/json/ct";
import { dropItem } from "./networking/json/drop-item";
import { initUserData } from "./networking/json/init-user-data";
import { moveToArea } from "./networking/json/move-to-area";
import { disableElement, enableElement } from "./ui-utils";

// import { FileManager } from '../../main/FileManager';
// FileManager.getInstance().writeJson(
//   FileManager.getInstance().basePath + '/packets.json',
//   [],
// );

const logger = Logger.get("FlashInterop");
const bot = Bot.getInstance();

// window.clear = () => {
//   FileManager.getInstance().writeJson(
//     FileManager.getInstance().basePath + '/packets.json',
//     [],
//   );
// };

window.packetFromClient = ([packet]: [string]) => {
  bot.emit("packetFromClient", packet);
};

window.packetFromServer = ([packet]: [string]) => {
  bot.emit("packetFromServer", packet);
};

window.pext = async ([packet]) => {
  const pkt = JSON.parse(packet);
  delete pkt.currentTarget;
  delete pkt.target;
  delete pkt.eventPhase;
  delete pkt.bubbles;
  delete pkt.cancelable;
  delete pkt.type;

  Bot.getInstance().emit("pext", pkt);

  // await FileManager.getInstance().appendJson(
  //   FileManager.getInstance().basePath + '/packets.json',
  //   pkt,
  // );

  if (pkt?.params?.type === "str") {
    const dataObj = pkt?.params?.dataObj; // ['exitArea', '-1', 'ENT_ID', 'PLAYER']

    // const ogPkt = `%xt%${dataObj.join("%")}%`; // %xt%exitArea%-1%ENT_ID%PLAYER%

    switch (dataObj[0]) {
      case "respawnMon":
        break;
      case "exitArea":
        bot.emit("playerLeave", dataObj[dataObj.length - 1]);
        break;
      case "uotls":
        if (
          Array.isArray(dataObj) &&
          dataObj?.length === 4 &&
          dataObj[2]?.toLowerCase() === bot.auth.username.toLowerCase() &&
          dataObj[3] === "afk:true"
        ) {
          bot.emit("afk");
        }

        break;
    }
  } else if (pkt?.params?.type === "json") {
    const dataObj = pkt?.params?.dataObj; // { intGold: 8, cmd: '', intExp: 0, bonusGold: 2, typ: 'm' }

    switch (pkt?.params?.dataObj?.cmd) {
      case "addGoldExp":
        void addGoldExp(bot, dataObj);
        break;
      case "ct":
        ct(bot, dataObj);
        break;
      case "dropItem":
        dropItem(bot, dataObj);
        break;
      case "initUserData":
        initUserData(bot, dataObj);
        break;
      case "moveToArea":
        void moveToArea(bot, dataObj);
        break;
    }
  }
};

window.connection = async ([state]: [string]) => {
  const elList = [
    document.querySelector("#cells")!,
    document.querySelector("#pads")!,
    document.querySelector("#x")!,
    document.querySelector("#bank")!,
  ];

  if (state === "OnConnection") {
    await bot.waitUntil(() => bot.player.isReady(), null, -1);
  }

  for (const el of elList) {
    if (state === "OnConnection") {
      enableElement(el as HTMLElement);
    } else if (state === "OnConnectionLost") {
      disableElement(el as HTMLElement);
    }
  }

  if (state === "OnConnection") bot.emit("login");
  else if (state === "OnConnectionLost") bot.emit("logout");
};

window.loaded = async () => {
  // await ipcRenderer.callMain(IPC_EVENTS.LOADED);

  const usernameArg = process.argv.find((arg) => arg.startsWith("--username="));
  const passwordArg = process.argv.find((arg) => arg.startsWith("--password="));
  const serverArg = process.argv.find((arg) => arg.startsWith("--server="));
  const scriptPath = process.argv.find((arg) =>
    arg.startsWith("--scriptPath="),
  );

  if (usernameArg && passwordArg && serverArg) {
    const [, username] = usernameArg.split("=");
    const [, password] = passwordArg.split("=");
    const [, server] = serverArg.split("=");

    if (!username || !password || !server) return;

    const ogDelay = bot.autoRelogin.delay;

    bot.autoRelogin.setCredentials(username!, password!, server!);
    bot.autoRelogin.delay = 0;

    // auto relogin should have triggered
    await bot.waitUntil(() => bot.player.isReady(), null, -1);

    // reset
    bot.autoRelogin.setCredentials("", "", "");
    bot.autoRelogin.delay = ogDelay;

    logger.info("auto relogin success, responding");
    await ipcRenderer
      .callMain(IPC_EVENTS.LOGIN_SUCCESS, { username })
      .catch(() => {});
  }

  if (scriptPath) {
    try {
      await bot.waitUntil(() => bot.player.isReady(), null, -1);

      if (window.context.isRunning()) return;

      const [, path] = scriptPath.split("=");
      const decodedPath = decodeURIComponent(path!);

      console.log("decodedPath", decodedPath);

      await ipcRenderer.callMain(IPC_EVENTS.LOAD_SCRIPT, {
        scriptPath: decodedPath,
      });
    } catch {}
  }
};

window.flashDebug = (...args: string[]) => {
  logger.info(...args);
};

// @ts-expect-error - provided by flash and properly typed
window.progress = (percent: number) => {
  const progressBar = document.querySelector("#progress-bar") as HTMLDivElement;
  const percentStr = `${percent}%`;

  progressBar.style.width = percentStr;
  progressBar.textContent = percentStr;

  setImmediate(() => {
    progressBar.textContent = percentStr;
  });

  if (percent >= 100) {
    const loaderContainer = document.querySelector(
      "#loader-container",
    ) as HTMLDivElement;
    const topnavContainer = document.querySelector(
      "#topnav-container",
    ) as HTMLDivElement;
    const gameContainer = document.querySelector(
      "#game-container",
    ) as HTMLDivElement;

    loaderContainer.classList.add("hidden");

    {
      const cl = topnavContainer.classList;
      cl.remove("invisible", "opacity-0");
      cl.add("opacity-100", "visible");
    }

    {
      const cl = gameContainer.classList;
      cl.remove("invisible", "opacity-0");
      cl.add("opacity-100", "visible");
    }
  }
};
