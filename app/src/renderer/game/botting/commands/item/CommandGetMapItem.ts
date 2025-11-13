import { Command } from "@botting/command";

export class CommandGetMapItem extends Command {
  public itemId!: number;

  public override async executeImpl() {
    await this.bot.world.getMapItem(this.itemId);
  }

  public override toString() {
    return `Get map item: ${this.itemId}`;
  }
}
