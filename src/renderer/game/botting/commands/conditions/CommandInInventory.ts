import { Command } from '../../command';

export class CommandInInventory extends Command {
  public item!: string;

  public qty?: number;

  public override execute() {
    if (
      (this.bot.inventory.get(this.item)?.quantity ?? -1) <= (this.qty ?? 1)
    ) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is in inventory: ${this.item} [x${this.qty ?? 1}]`;
  }
}
