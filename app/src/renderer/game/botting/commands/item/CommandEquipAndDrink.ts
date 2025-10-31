import { Command } from "@botting/command";

export class CommandEquipAndDrink extends Command {
  public items!: string[];

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
  }

  public override toString() {
    return `Equip and drink: ${this.items.join(", ")}`;
  }
}
