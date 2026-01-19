import type { Bot } from "~/renderer/game/lib/core/Bot";
import { type BoostType, BoostTypes } from "../core/player/Player";
import { Job } from "./Job";

export class BoostsJob extends Job {
  public constructor(private readonly bot: Bot) {
    super("boosts", 0);
  }

  public async execute(): Promise<void> {
    if (this.bot.environment.boosts.size === 0) return;

    for (const boost of this.bot.environment.boosts) {
      const type = this.resolveBoostType(boost);
      if (!type) continue;

      const item = this.bot.player.inventory.get(boost);
      if (!item?.isBoost()) continue;
      if (this.bot.player.isBoostActive(type)) continue;

      this.bot.flash.call("world.sendUseItemRequest", item.data);
    }
  }

  private resolveBoostType(name: string): BoostType | null {
    const lower = name.toLowerCase();
    if (lower.includes("gold")) return BoostTypes.Gold;
    if (lower.includes("xp")) return BoostTypes.Exp;
    if (lower.includes("rep")) return BoostTypes.Rep;
    if (lower.includes("class")) return BoostTypes.ClassPoints;
    return null;
  }
}
