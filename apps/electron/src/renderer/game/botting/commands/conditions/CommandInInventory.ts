import { Command } from "../../command";

export class CommandInInventory extends Command {
  public item!: string;

  public qty = 1;

  public override skipDelay = true;

  public override execute() {
    if ((this.bot.inventory.get(this.item)?.quantity ?? 0) <= this.qty) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is in inventory: ${this.item} [x${this.qty}]`;
  }
}
