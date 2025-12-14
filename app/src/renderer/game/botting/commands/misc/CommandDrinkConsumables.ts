import { Command } from "@botting/command";

export class CommandDrinkConsumables extends Command {
  public items!: string[];

  public equipAfter!: string;

  public override async executeImpl() {
    for (const item of this.items) {
      await this.bot.player.inventory.equip(item);

      const res = await this.bot.waitUntil(
        () => this.bot.flash.get("world.lockdownPots", true) === false,
      );
      if (res.isErr() && res.error === "timeout")
        this.logger.warn("Timed out but potions are still locked...");

      await this.bot.combat.useSkill(5, true, true);
      await this.bot.sleep(1_000);
    }

    if (this.equipAfter) {
      await this.bot.player.inventory.equip(this.equipAfter);
    }
  }

  public override toString() {
    if (this.items.length === 1) {
      return `Drink consumable: ${this.items[0]}${this.equipAfter ? ` [${this.equipAfter}]` : ""}`;
    }

    return `Drink consumables: ${this.items.join(", ")}${this.equipAfter ? ` [${this.equipAfter}]` : ""}`;
  }
}
