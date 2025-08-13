import { Mutex } from "async-mutex";
import { interval } from "../../../shared/interval";
// import { Logger } from "../../../common/logger";
import { handlers } from "../../../shared/tipc";
import { Bot } from "../lib/Bot";

const mutex = new Mutex();

let on = false;
let index = 0;

const bot = Bot.getInstance();
// const logger = Logger.get("IpcSpammer");

handlers.packetSpammerStart.listen(({ packets, delay }) => {
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

handlers.packetSpammerStop.listen(() => {
  // logger.info("stop packet spammer");
  on = false;
  index = 0;
});
