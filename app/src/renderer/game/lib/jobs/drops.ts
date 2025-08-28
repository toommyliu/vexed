import type { Bot } from "../Bot";
import { Job } from "./Job";
// import { Logger } from "@vexed/logger";

// const logger = Logger.get("DropsJob", { precision: 3 });

// TODO:

export class DropsJob extends Job {
  private lastProcessedId: number | null = null;

  // itemId -> executionCount
  private readonly recentlyRejected = new Map<number, number>();

  private executionCount = 0;

  private readonly rejectCooldownExecutions: number;

  public constructor(private readonly bot: Bot) {
    super("drops", 1);

    // How many execution cycles to wait before trying to reject the same item again.
    this.rejectCooldownExecutions = 3; // Don't reject for the next 3 runs.

    this.bot.environment.on("itemNamesChanged", () => {
      this.restart();
    });
  }

  public restart(): void {
    this.lastProcessedId = null;
    this.recentlyRejected.clear();
    this.executionCount = 0;
  }

  public async execute(): Promise<void> {
    // logger.info("Executing DropsJob");
    this.executionCount++;

    const itemIds = Array.from(this.bot.drops.dropCounts.keys());
    if (itemIds.length === 0) {
      this.lastProcessedId = null;
      return;
    }

    const lastIndex = this.lastProcessedId
      ? itemIds.indexOf(this.lastProcessedId)
      : -1;
    const startIndex = (lastIndex + 1) % itemIds.length;

    for (let idx = 0; idx < itemIds.length; idx++) {
      const currentIndex = (startIndex + idx) % itemIds.length;
      const itemId = itemIds[currentIndex];

      if (typeof itemId !== "number") continue;

      const item = this.bot.drops.getItemFromId(itemId);
      if (!item) {
        this.recentlyRejected.delete(itemId);
        continue;
      }

      let actionToTake: "pickup" | "reject" | undefined;

      if (this.bot.environment.hasItemName(item.sName)) {
        actionToTake = "pickup";
      } else if (this.bot.environment.rejectElse) {
        const rejectedAtExecution = this.recentlyRejected.get(itemId);

        if (
          !rejectedAtExecution ||
          this.executionCount - rejectedAtExecution >
            this.rejectCooldownExecutions
        ) {
          actionToTake = "reject";
        }
      }

      if (actionToTake) {
        await this.processItem(itemId, actionToTake);
        this.lastProcessedId = itemId;
        return;
      }
    }
  }

  private async processItem(
    itemId: number,
    action: "pickup" | "reject",
  ): Promise<void> {
    const item = this.bot.drops.getItemFromId(itemId);
    if (!item) return;

    try {
      if (action === "pickup") {
        this.recentlyRejected.delete(itemId);
        await this.bot.drops.pickup(itemId);
        console.log(`Picked up item: ${item.sName} : ${itemId}`);
      } else if (action === "reject") {
        await this.bot.drops.reject(itemId);
        console.log(`Rejected else: ${item.sName} : ${itemId}`);
        this.recentlyRejected.set(itemId, this.executionCount);
      }
    } catch (error) {
      console.error(
        `Error ${action}ing item ${itemId} (${item.sName}):`,
        error,
      );
    }
  }
}
