import type { Bot } from "../Bot";
import { Job } from "./Job";

export class DropsJob extends Job {
  private index = 0;

  private isRestarting = false;

  private readonly recentlyRejected = new Map<number, number>();

  private readonly recentRejectWindowMs: number;

  public constructor(private readonly bot: Bot) {
    super("drops", 1);

    this.bot = bot;

    this.recentRejectWindowMs = 2_000;

    this.bot.environment.on("itemNamesChanged", () => {
      this.restart();
    });
  }

  public restart(): void {
    this.index = 0;
    this.isRestarting = true;
    this.recentlyRejected.clear();
  }

  public async execute(): Promise<void> {
    const itemIds = Array.from(this.bot.drops.dropCounts.keys());
    if (itemIds.length === 0) return;

    if (this.isRestarting) {
      this.isRestarting = false;
      return;
    }

    const itemId = itemIds[this.index];
    if (typeof itemId !== "number") {
      this.index = (this.index + 1) % itemIds.length;
      return;
    }

    const item = this.bot.drops.getItemFromId(itemId);
    if (!item) {
      this.recentlyRejected.delete(itemId);
      this.index = (this.index + 1) % itemIds.length;
      return;
    }

    if (this.bot.environment.hasItemName(item.sName)) {
      await this.processItem(itemId, "pickup");
    } else if (this.bot.environment.rejectElse) {
      const now = Date.now();
      const rejectedAt = this.recentlyRejected.get(itemId);

      if (!rejectedAt || now - rejectedAt >= this.recentRejectWindowMs) {
        await this.processItem(itemId, "reject");
      }
    }

    this.index = (this.index + 1) % itemIds.length;
  }

  private async processItem(
    itemId: number,
    action: "pickup" | "reject",
  ): Promise<void> {
    const item = this.bot.drops.getItemFromId(itemId);
    if (!item) return;

    try {
      if (action === "pickup") {
        // Always clear from recently rejected when picking up
        if (this.recentlyRejected.has(itemId)) {
          this.recentlyRejected.delete(itemId);
        }

        await this.bot.drops.pickup(itemId);
        console.log(`picked up item: ${item.sName} : ${itemId}`);
      } else if (action === "reject") {
        await this.bot.drops.reject(itemId);
        console.log(`reject else: ${item.sName} : ${itemId}`);
        this.recentlyRejected.set(itemId, Date.now());
      }
    } catch (error) {
      console.error(
        `Error ${action}ing item ${itemId} (${item.sName}):`,
        error,
      );
    }

    await this.bot.sleep(50);
  }
}
