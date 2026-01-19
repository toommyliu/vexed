import { BoostType } from "@vexed/game";
import type { Bot } from "~/lib/Bot";
import { Job } from "./Job";

export class BoostsJob extends Job {
  public constructor(private readonly bot: Bot) {
    super("boosts", 0);
  }

  public async execute(): Promise<void> {
    if (this.bot.environment.boosts.size === 0) return;

    for (const boost of this.bot.environment.boosts) {
      const variant = this.resolveBoostType(boost);
      if (!variant) continue;

      const item = this.bot.inventory.get(boost);
      if (item?.data.sType !== "ServerUse") continue;

      if (this.bot.player.isBoostActive(variant)) continue;

      this.bot.flash.call(() => swf.playerUseBoost(item.id));
    }
  }

  private resolveBoostType(name: string): BoostType | null {
    const lower = name.toLowerCase();
    if (lower.includes("gold")) return BoostType.Gold;
    if (lower.includes("xp")) return BoostType.Exp;
    if (lower.includes("rep")) return BoostType.Rep;
    if (lower.includes("class")) return BoostType.ClassPoints;
    return null;
  }
}
