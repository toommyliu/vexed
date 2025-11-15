import process from "process";
import log from "electron-log/renderer";
import { XMLParser } from "fast-xml-parser";
import { Bot } from "@lib/Bot";
import { AutoReloginJob } from "@lib/jobs/autorelogin";
import { client } from "@shared/tipc";
import { AuraStore } from "./lib/util/AuraStore";
import { addGoldExp } from "./packet-handlers/add-gold-exp";
import { ct } from "./packet-handlers/ct";
import { dropItem } from "./packet-handlers/drop-item";
import { event } from "./packet-handlers/event";
import { initUserData } from "./packet-handlers/init-user-data";
import { initUserDatas } from "./packet-handlers/initUserDatas";
import { moveToArea } from "./packet-handlers/move-to-area";
import { appState } from "./state.svelte";

const logger = log.scope("game/flash-interop");

const bot = Bot.getInstance();

window.packetFromClient = ([packet]: [string]) => {
  bot.emit("packetFromClient", packet);
};

window.packetFromServer = ([packet]: [string]) => {
  bot.emit("packetFromServer", packet);

  if (packet.startsWith("{")) {
    const pkt = JSON.parse(packet);

    if (
      typeof pkt?.t === "string" &&
      pkt?.t === "xt" &&
      typeof pkt?.b?.o?.cmd === "string" &&
      pkt?.b?.o?.cmd === "ct"
    ) {
      ct(bot, pkt?.b?.o);
    }
  } else if (packet.startsWith("<") && packet.includes("action='joinOK'")) {
    const parser = new XMLParser({
      ignoreAttributes: false, // preserve attributes
      attributeNamePrefix: "", // don't prefix attribute names
    });
    const pkt = parser.parse(packet);

    // TODO: this id is the same as entID

    if (Array.isArray(pkt?.msg?.body?.uLs?.u)) {
      for (const [name] of bot.world.playerUids) {
        if (name.toLowerCase() !== bot.auth.username.toLowerCase())
          bot.world.playerUids.delete(name);
      }

      for (const [username] of AuraStore.playerAuras) {
        if (username.toLowerCase() !== bot.auth.username.toLowerCase())
          AuraStore.clearPlayerAuras(username);
      }

      for (const [monMapId] of AuraStore.monsterAuras)
        AuraStore.monsterAuras.delete(monMapId);

      for (const user of pkt?.msg?.body?.uLs?.u ?? []) {
        const username = user?.n;
        const uid = Number.parseInt(user?.i, 10);
        bot.world.playerUids.set(username, uid);
      }
    }
  }
};

window.pext = async ([packet]) => {
  const pkt = JSON.parse(packet);
  delete pkt.currentTarget;
  delete pkt.target;
  delete pkt.eventPhase;
  delete pkt.bubbles;
  delete pkt.cancelable;
  delete pkt.type;

  bot.emit("pext", pkt);

  if (pkt?.params?.type === "str") {
    const dataObj = pkt?.params?.dataObj; // ['exitArea', '-1', 'ENT_ID', 'PLAYER']

    // const ogPkt = `%xt%${dataObj.join("%")}%`; // %xt%exitArea%-1%ENT_ID%PLAYER%

    switch (dataObj[0]) {
      case "respawnMon":
        break;
      case "exitArea":
        {
          const playerName = dataObj[dataObj.length - 1];
          AuraStore.clearPlayerAuras(playerName);
          bot.emit("playerLeave", playerName);
        }

        break;
      case "uotls":
        if (
          Array.isArray(dataObj) &&
          dataObj?.length === 4 &&
          dataObj[2]?.toLowerCase() === bot.auth?.username?.toLowerCase() &&
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
      case "dropItem":
        void dropItem(bot, dataObj);
        break;
      case "initUserData":
        initUserData(bot, dataObj);
        break;
      case "initUserDatas":
        void initUserDatas(bot, dataObj);
        break;
      case "moveToArea":
        void moveToArea(bot, dataObj);
        break;
      case "event":
        void event(bot, dataObj);
        break;
      case "clearAuras":
        AuraStore.clearPlayerAuras(bot.auth.username.toLowerCase()); // only ever called on ourselves
    }
  }
};

window.connection = async ([state]: [string]) => {
  if (state === "OnConnection") {
    await bot.waitUntil(() => bot.player.isReady(), { indefinite: true });
    bot.emit("login");
  } else if (state === "OnConnectionLost") {
    await bot.waitUntil(() => !bot.player.isReady(), { indefinite: true });
    bot.emit("logout");
  }
};

window.loaded = async () => {
  window.dispatchEvent(new Event("gameLoaded"));
  appState.gameLoaded = true;

  void bot.scheduler.start();

  const usernameArg = process.argv.find((arg) => arg.startsWith("--username="));
  const passwordArg = process.argv.find((arg) => arg.startsWith("--password="));
  const scriptPath = process.argv.find((arg) =>
    arg.startsWith("--scriptPath="),
  );

  if (usernameArg && passwordArg) {
    const [, username] = usernameArg.split("=");
    const [, password] = passwordArg.split("=");

    const serverArg = process.argv.find((arg) => arg.startsWith("--server="));
    const server = serverArg?.split("=")?.[1];

    if (!username || !password) {
      return;
    }

    if (server) {
      await AutoReloginJob.setCredentials(username!, password!, server!);

      bot.once("login", async () => {
        await AutoReloginJob.reset();
        await client.manager.managerLoginSuccess({ username });
      });
    } else {
      bot.auth.login(username!, password!);

      await bot.waitUntil(
        () => bot.flash.get("mcLogin.currentLabel", true) === "Servers",
        { indefinite: true },
      );

      await client.manager.managerLoginSuccess({ username });
    }
  }

  if (scriptPath) {
    try {
      await bot.waitUntil(() => bot.player.isReady(), { indefinite: true });

      if (window.context.isRunning()) return;

      const [, path] = scriptPath.split("=");
      const decodedPath = decodeURIComponent(path!);

      await client.scripts.loadScript({ scriptPath: decodedPath });
    } catch {}
  }
};

window.flashDebug = (...args: string[]) => {
  if (args.length === 1) {
    logger.info(args[0]);
    return;
  }

  logger.info(...args);
};

// @ts-expect-error - provided by flash and properly typed
window.progress = (percent: number) => {
  const progressText = document.querySelector(
    "#progress-text",
  ) as HTMLSpanElement;
  const percentStr = `${percent}%`;

  if (progressText) progressText.textContent = percentStr;

  setImmediate(() => {
    if (progressText) progressText.textContent = percentStr;
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
