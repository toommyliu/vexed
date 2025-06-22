import { Bot } from "../lib/Bot";

const bot = Bot.getInstance();
const activeDrops = new Set<string>(); // Set of item names

let rejectElseEnabled = false;
let stopFn: (() => void) | null = null;
let abortController: AbortController | null = null;

export function startDropsTimer() {
  stopDropsTimer();

  abortController = new AbortController();

  const runLoop = async () => {
    while (!abortController?.signal?.aborted) {
      if (!bot.player.isReady()) {
        await bot.sleep(1_000);
        continue;
      }

      const signal = abortController?.signal;
      if (signal?.aborted) return;

      // console.log(`active drops`, activeDrops);

      for (const itemId /* itemID */ of bot.drops.dropCounts.keys()) {
        if (signal?.aborted) break;

        const item = bot.drops.getItemFromId(itemId);
        if (!item) {
          console.warn(`Drop not found for ${itemId}`);
          continue;
        }

        if (activeDrops.has(item.sName)) {
          console.log(`pickup drop`, item.sName);
          try {
            await Promise.race([
              bot.drops.pickup(itemId),
              new Promise((_resolve, reject) => {
                signal?.addEventListener("abort", () =>
                  reject(new Error("Operation aborted")),
                );
              }),
            ]);
          } catch {}
        } else if (rejectElseEnabled) {
          // console.log(`reject drop`, item.sName);
          try {
            await Promise.race([
              bot.drops.reject(itemId).catch(() => {}),
              new Promise((_resolve, reject) => {
                signal?.addEventListener("abort", () =>
                  reject(new Error("Operation aborted")),
                );
              }),
            ]);
          } catch {}
        }

        await bot.sleep(500);
      }

      await bot.sleep(1_000);
    }
  };

  void runLoop();
}

export function stopDropsTimer() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  if (stopFn) {
    // console.log("Stopping drops timer");
    stopFn();
    stopFn = null;
  }

  // activeDrops.clear();
}

/**
 * Registers a drop to begin tracking.
 *
 * @param drop - The drop name to register.
 * @param rejectElse - Whether to reject other drops.
 */
export function registerDrop(drop: string, rejectElse: boolean = false) {
  if (activeDrops.has(drop)) return;

  console.log(`Registering drop: ${drop}`);
  activeDrops.add(drop);
  rejectElseEnabled = rejectElse;
}

/**
 * Unregisters a drop.
 *
 * @param drop - The drop name to unregister.
 */
export function unregisterDrop(drop: string) {
  if (!activeDrops.has(drop)) return;

  console.log(`Unregistering drop: ${drop}`);
  activeDrops.delete(drop);
}
