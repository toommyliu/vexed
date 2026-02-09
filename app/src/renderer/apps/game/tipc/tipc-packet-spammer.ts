import { interval } from "@vexed/utils";
import { Mutex } from "async-mutex";
import { handlers } from "~/shared/tipc";
import { Bot } from "../lib/Bot";

const mutex = new Mutex();

let on = false;
let index = 0;

handlers.packets.startSpammer.listen(({ packets, delay }) => {
  if (!packets?.length) return;
  on = true;
  index = 0;

  const bot = Bot.getInstance();
  void interval(
    async (_, stop) => {
      if (!on) {
        stop();
        return;
      }

      if (!bot.player.isReady()) return;
      await mutex.runExclusive(() => {
        bot.packets.sendServer(packets[index]!);
        index = (index + 1) % packets.length;
      });
    },
    delay,
    { stopOnError: false },
  );
});

handlers.packets.stopSpammer.listen(() => {
  on = false;
  index = 0;
});
