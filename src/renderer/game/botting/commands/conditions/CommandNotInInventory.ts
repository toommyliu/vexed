import { Command } from "../../command";

export class CommandNotInInventory extends Command {
  public item!: string;

  public qty = 1;

  public override skipDelay = true;

  public override execute() {
    if (!this.bot.inventory.contains(this.item, this.qty)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is not in inventory: ${this.item} [x${this.qty}]`;
  }
}
