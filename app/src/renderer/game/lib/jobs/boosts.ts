import type { Bot } from "@lib/Bot";
import { BoostType } from "../Player";
import { Job } from "./Job";

export class BoostsJob extends Job {
  private index = 0;

  public constructor(private readonly bot: Bot) {
    super("boosts", 0);

    this.bot.environment.on("boostsChanged", () => {
      this.restart();
    });
  }

  public restart(): void {
    this.index = 0;
  }

  public async execute(): Promise<void> {
    const boosts = Array.from(this.bot.environment.boosts);
    if (boosts.length === 0) return;

    if (this.index >= boosts.length) this.index = 0;

    const boost = boosts[this.index];
    if (!boost) return;

    if (this.bot.inventory.contains(boost)) {
      const variant = this.getVariantFromName(boost);

      if (!variant) return;

      if (!this.bot.player.isBoostActive(variant)) {
        const item = this.bot.inventory.get(boost);
        if (!item) return;
        this.bot.flash.call(() => swf.playerUseBoost(item.id));
      }
    }

    this.index = (this.index + 1) % boosts.length;
  }

  private getVariantFromName(name: string): BoostType | null {
    const lower = name.toLowerCase();
    if (lower.includes("gold")) return BoostType.Gold;
    if (lower.includes("xp")) return BoostType.Exp;
    if (lower.includes("rep")) return BoostType.Rep;
    if (lower.includes("class")) return BoostType.ClassPoints;
    return null;
  }
}
