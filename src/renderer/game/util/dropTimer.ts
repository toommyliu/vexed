import { interval } from '../../../common/interval';
import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();
let on = false;

export function startDropsTimer(drops: string[]) {
  on = true;

  void interval(async (_, stop) => {
    if (!on) {
      stop();
      return;
    }

    if (!drops.length) return;

    for (const drop of drops) {
      try {
        void bot.drops.pickup(drop);
      } catch {}
    }
  }, 1_000);
}

export function stopDropsTimer() {
  on = false;
}
