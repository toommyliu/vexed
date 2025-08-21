import { Bot } from "../Bot";
import { Job } from "./Job";

export class DropsJob extends Job {
  public constructor() {
    super("drops", 1);
  }

  public async execute(): Promise<void> {
    const bot = Bot.getInstance();
    for (const itemId of bot.drops.dropCounts.keys()) {
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
}
