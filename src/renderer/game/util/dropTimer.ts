import { interval } from "../../../common/interval";
import { Bot } from "../lib/Bot";

const bot = Bot.getInstance();
const activeDrops = new Set<string>();

let rejectElseEnabled = false;
let stopFn: (() => void) | null = null;

export function startDropsTimer() {
  stopDropsTimer();

  void interval(async (_, stop) => {
    stopFn ??= stop;

    if (!bot.player.isReady()) return;

    for (const drop of Object.keys(bot.drops.stack)) {
      if (activeDrops.has(drop)) {
        try {
          await bot.drops.pickup(drop);
        } catch {}
      } else if (rejectElseEnabled) {
        try {
          await bot.drops.reject(drop);
        } catch {}
      }
    }
  }, 1_000);
}

export function stopDropsTimer() {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }

  activeDrops.clear();
}

/**
 * Registers a drop to begin tracking.
 *
 * @param drop - The drop id to register.
 * @param rejectElse - Whether to reject other drops.
 */
export function registerDrop(drop: string, rejectElse: boolean = false) {
  if (activeDrops.has(drop)) return;

  activeDrops.add(drop);
  rejectElseEnabled = rejectElse;
}

/**
 * Unregisters a drop.
 *
 * @param drop - The drop id to unregister.
 */
export function unregisterDrop(drop: string) {
  if (!activeDrops.has(drop)) return;

  activeDrops.delete(drop);
}

export function getActiveDrops() {
  return Array.from(activeDrops);
}
