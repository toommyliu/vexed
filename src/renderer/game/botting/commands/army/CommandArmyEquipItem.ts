import { Command } from "../../command";

// CommandEquipItem but uses a config file to get an item name by key
// ArmyCommand not necessary?

export class CommandArmyEquipItem extends Command {
  // This is the name of the item in the config file
  // For armying purposes, items are referenced by their enchantment name (e.g. Dauntless)
  public itemName!: string;

  public override async execute() {
    const item = this.bot.army.config.get(this.itemName);
    if (!item) {
      console.warn(`ArmyEquipItem: Item not found in config: ${this.itemName}`);
      return;
    }

    await this.bot.inventory.equip(item);
  }

  public override toString() {
    return `Army equip item: ${this.itemName}`;
  }
}
