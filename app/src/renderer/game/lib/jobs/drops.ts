import type { Bot } from "../Bot";
import { Job } from "./Job";

export class DropsJob extends Job {
  private index = 0;

  private isRestarting = false;

  private readonly recentlyRejected = new Map<number, number>();

  private readonly recentRejectWindowMs: number;

  private readonly batchSize: number;

  private readonly rejectBatchSize: number;

  public constructor(private readonly bot: Bot) {
    super("drops", 1);

    this.bot = bot;

    this.recentRejectWindowMs = 2_000;
    this.batchSize = 3;
    this.rejectBatchSize = 5;

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

    const { wantedItems, unwantedItems } = this.categorizeItems(itemIds);

    // Process wanted items first (higher priority)
    if (wantedItems.length > 0) {
      await this.processBatch(wantedItems, this.batchSize, "pickup");
    }

    // Then bulk reject unwanted items if rejectElse is enabled
    if (this.bot.environment.rejectElse && unwantedItems.length > 0) {
      const itemsToReject = this.filterRecentlyRejected(unwantedItems);
      await this.processBatch(itemsToReject, this.rejectBatchSize, "reject");
    }

    this.index =
      (this.index + Math.max(wantedItems.length, unwantedItems.length)) %
      itemIds.length;
  }

  private categorizeItems(itemIds: number[]): {
    unwantedItems: number[];
    wantedItems: number[];
  } {
    const wantedItems: number[] = [];
    const unwantedItems: number[] = [];

    for (let idx = 0; idx < itemIds.length; idx++) {
      const itemId = itemIds[(this.index + idx) % itemIds.length];
      if (typeof itemId !== "number") continue;

      const item = this.bot.drops.getItemFromId(itemId);
      if (!item) {
        this.recentlyRejected.delete(itemId);
        continue;
      }

      if (this.bot.environment.hasItemName(item.sName)) {
        wantedItems.push(itemId);
      } else {
        unwantedItems.push(itemId);
      }
    }

    return { wantedItems, unwantedItems };
  }

  private filterRecentlyRejected(itemIds: number[]): number[] {
    const now = Date.now();
    return itemIds.filter((itemId) => {
      const rejectedAt = this.recentlyRejected.get(itemId);
      return !rejectedAt || now - rejectedAt >= this.recentRejectWindowMs;
    });
  }

  private async processBatch(
    itemIds: number[],
    maxCount: number,
    action: "pickup" | "reject",
  ): Promise<void> {
    const itemsToProcess = itemIds.slice(0, maxCount);
    for (const itemId of itemsToProcess) await this.processItem(itemId, action);
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
