import { Command } from "../../command";

export class CommandEquipItem extends Command {
  public itemName!: string;

  public override async execute() {
    await this.bot.inventory.equip(this.itemName);
  }

  public override toString() {
    return `Equip item: ${this.itemName}`;
  }
}
