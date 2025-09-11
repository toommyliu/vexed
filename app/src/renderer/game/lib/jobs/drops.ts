import type { Bot } from "../Bot";
import { Job } from "./Job";

export class DropsJob extends Job {
  public constructor(private readonly bot: Bot) {
    super("drops", 1);
  }

  public override async execute() {
    for (const itemId of this.bot.drops.dropCounts.keys()) {
      const itemData = this.bot.drops.getItemFromId(itemId);
      if (!itemData) continue;

      if (this.bot.environment.hasItemName(itemData.sName))
        await this.bot.drops.pickup(itemId);
      else if (this.bot.environment.rejectElse)
        await this.bot.drops.reject(itemId);

      await this.bot.sleep(100);
    }
  }
}
