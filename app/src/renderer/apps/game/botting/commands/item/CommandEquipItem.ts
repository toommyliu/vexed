import { Command } from "../../command";

export class CommandEquipItem extends Command {
  public itemName!: string;

  public override async executeImpl() {
    this.logger.debug(this.toString());
    await this.bot.inventory.equip(this.itemName);
  }

  public override toString() {
    return `Equip item: ${this.itemName}`;
  }
}
