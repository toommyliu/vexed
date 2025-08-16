import { interval } from "@vexed/utils";
import { Mutex } from "async-mutex";
import { handlers } from "@shared/tipc";
import { Bot } from "../lib/Bot";

const mutex = new Mutex();

let on = false;
let index = 0;

const bot = Bot.getInstance();
// const logger = Logger.get("IpcSpammer");

handlers.packetSpammer.start.listen(({ packets, delay }) => {
  // logger.info("start packet spammer", { packets, delay });

  if (!packets?.length) return;

  on = true;
  index = 0;

  void interval(
    async (_, stop) => {
      if (!on) {
        stop();
        return;
      }

      // logger.info("tick");

      if (!bot.player.isReady()) return;

      await mutex.runExclusive(() => {
        // logger.info(`sending packet: ${packets[index]}`);
        // bot.packets.sendServer(packets[index]!);
        index = (index + 1) % packets.length;
      });
    },
    delay,
    { stopOnError: false },
  );
});

handlers.packetSpammer.stop.listen(() => {
  // logger.info("stop packet spammer");
  on = false;
  index = 0;
});
