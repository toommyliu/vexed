import type { Bot } from "../Bot";
import { Job } from "./Job";

export class DropsJob extends Job {
  private index = 0;

  private isRestarting = false;

  public constructor(private readonly bot: Bot) {
    super("drops", 1);

    this.bot = bot;

    this.bot.environment.on("itemNamesChanged", () => {
      this.restart();
    });
  }

  public restart(): void {
    this.index = 0;
    this.isRestarting = true;
  }

  public async execute(): Promise<void> {
    const itemIds = Array.from(this.bot.drops.dropCounts.keys());
    if (itemIds.length === 0) return;

    if (this.isRestarting) {
      this.isRestarting = false;
      return;
    }

    const itemId = itemIds[this.index];
    if (typeof itemId !== "number") return;

    const item = this.bot.drops.getItemFromId(itemId);

    if (item) {
      try {
        if (this.bot.environment.hasItemName(item.sName)) {
          await this.bot.drops.pickup(itemId);
        } else if (this.bot.environment.rejectElse) {
          await this.bot.drops.reject(itemId);
        }
      } catch (error) {
        console.error(`Error processing item ${itemId}:`, error);
      }
    }

    this.index = (this.index + 1) % itemIds.length;
    await this.bot.sleep(500);
  }
}
