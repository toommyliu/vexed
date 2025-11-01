import { Command } from "@botting/command";

export class CommandDrinkConsumables extends Command {
  public items!: string[];

  public equipAfter!: string;

  public override async execute() {
    for (const item of this.items) {
      await this.bot.inventory.equip(item);
      await this.bot.waitUntil(
        () => this.bot.flash.get("world.lockdownPots", true) === false,
        null,
        -1,
      );
      await this.bot.combat.useSkill(5, true, true);
      await this.bot.sleep(1_000);
    }

    if (this.equipAfter) {
      await this.bot.inventory.equip(this.equipAfter);
    }
  }

  public override toString() {
    if (this.items.length === 1) {
      return `Drink consumable: ${this.items[0]}${this.equipAfter ? ` [${this.equipAfter}]` : ""}`;
    }

    return `Drink consumables: ${this.items.join(", ")}${this.equipAfter ? ` [${this.equipAfter}]` : ""}`;
  }
}
