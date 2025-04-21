import { interval } from '../../../common/interval';
import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();
let on = false;

export function startDropsTimer(drops: string[], rejectElse: boolean = false) {
  on = true;

  const allowedDrops = new Set(drops);
  if (!allowedDrops.size) {
    return;
  }

  void interval(async (_, stop) => {
    if (!on) {
      stop();
      return;
    }

    if (!bot.player.isReady()) return;

    const currentDrops = Object.keys(bot.drops.stack);
    for (const drop of currentDrops) {
      if (allowedDrops.has(drop)) {
        try {
          await bot.drops.pickup(drop);
        } catch {}
      } else if (rejectElse) {
        try {
          await bot.drops.reject(drop);
        } catch {}
      }
    }
  }, 1_000);
}

export function stopDropsTimer() {
  on = false;
}
