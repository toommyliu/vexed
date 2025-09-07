import { Mutex } from "async-mutex";
import type { Bot } from "@lib/Bot";
import type { ItemData } from "@lib/models/Item";

const mutex = new Mutex();

const recentlyRejected = new Map<string, number>();
const REJECT_COOLDOWN_MS = 5_000;

// TODO: drops that were recently rejected that don't drop again
// won't be processed.

export async function dropItem(bot: Bot, packet: DropItemPacket) {
  for (const itemData of Object.values(packet.items)) {
    bot.drops.addDrop(itemData);

    const releaseFn = await mutex.acquire();

    try {
      if (bot.environment.hasItemName(itemData.sName)) {
        console.log(`Item dropped: ${itemData.sName}, picking it up now`);
        await bot.drops.pickup(itemData.sName);
      } else if (
        bot.environment.rejectElse &&
        shouldRejectItem(itemData.sName)
      ) {
        console.log(`Item dropped: ${itemData.sName}, rejecting it`);
        await bot.drops.reject(itemData.sName, false);
        recentlyRejected.set(itemData.sName, Date.now());
      } else {
        console.log(
          `Item dropped: ${itemData.sName}, ignoring (recently rejected or not configured)`,
        );
      }
    } catch (error) {
      console.error(`Error processing dropped item ${itemData.sName}:`, error);
    } finally {
      releaseFn();
    }
  }
}

function shouldRejectItem(itemName: string): boolean {
  const lastRejectedTime = recentlyRejected.get(itemName);
  if (!lastRejectedTime) return true;

  const timeSinceRejection = Date.now() - lastRejectedTime;
  if (timeSinceRejection > REJECT_COOLDOWN_MS) {
    recentlyRejected.delete(itemName);
    return true;
  }

  return false;
}

window.setInterval(() => {
  const now = Date.now();
  for (const [itemName, timestamp] of recentlyRejected.entries()) {
    if (now - timestamp > REJECT_COOLDOWN_MS) {
      recentlyRejected.delete(itemName);
    }
  }
}, REJECT_COOLDOWN_MS);

export type DropItemPacket = {
  cmd: "dropItem";
  items: Record<number, ItemData>;
};
