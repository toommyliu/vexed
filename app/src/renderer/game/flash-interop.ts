import process from "process";
import log from "electron-log/renderer";
import { Bot } from "~/lib/Bot";
import { AutoReloginJob } from "~/lib/jobs/autorelogin";
import { client } from "~/shared/tipc";
import { ct } from "./packet-handlers/ct";
import { dispatchJsonPacket, dispatchStrPacket } from "./packet-handlers";
import { appState } from "./state.svelte";

const logger = log.scope("game/flash-interop");

const bot = Bot.getInstance();

window.packetFromClient = ([packet]: [string]) => {
  bot.emit("packetFromClient", packet);
};

let lastServerCt: unknown = null;
let lastPextCt: unknown = null;

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
      lastServerCt = pkt?.b?.o;
      ct(bot, pkt?.b?.o);
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
    const dataObj = pkt?.params?.dataObj as string[];
    dispatchStrPacket(bot, dataObj);
  } else if (pkt?.params?.type === "json") {
    const dataObj = pkt?.params?.dataObj;
    const cmd = dataObj?.cmd as string | undefined;

    if (cmd === "ct") {
      lastPextCt = dataObj;
      if (lastServerCt && lastPextCt) {
        const serverStr = JSON.stringify(
          lastServerCt,
          // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
          Object.keys(lastServerCt as object).sort(),
        );
        const pextStr = JSON.stringify(
          lastPextCt,
          // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
          Object.keys(lastPextCt as object).sort(),
        );
        if (serverStr !== pextStr) {
          logger.warn("CT DIFF DETECTED!");
          logger.warn("Server CT:", lastServerCt);
          logger.warn("Pext CT:", lastPextCt);
        }

        lastServerCt = null;
        lastPextCt = null;
      }
    }

    if (cmd) {
      dispatchJsonPacket(bot, cmd, dataObj);
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
    } catch { }
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
