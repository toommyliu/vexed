import { interval } from '../../../common/interval';
import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();
let stopFn: (() => void) | null = null;

export function startDropsTimer(drops: string[], rejectElse: boolean = false) {
  stopDropsTimer();

  const allowedDrops = new Set(drops);

  void interval(async (_, stop) => {
    if (!stopFn) {
      stopFn = stop;
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
  }, 1_000).finally(() => {
    if (stopFn) {
      stopFn();
      stopFn = null;
    }
  });
}

export function stopDropsTimer() {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }
}
