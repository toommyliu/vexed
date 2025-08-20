import { Bot } from "../Bot";

const bot = Bot.getInstance();

export async function dropJob() {
  for (const itemId /* itemID */ of bot.drops.dropCounts.keys()) {
    const item = bot.drops.getItemFromId(itemId);
    if (!item) continue;

    try {
      if (bot.environment.hasItemName(item.sName)) {
        await bot.drops.pickup(itemId);
      } else if (bot.environment.rejectElse) {
        await bot.drops.reject(itemId);
      }
    } catch (error) {
      console.error(`Error processing item ${itemId}:`, error);
    }

    await bot.sleep(500);
  }
}
