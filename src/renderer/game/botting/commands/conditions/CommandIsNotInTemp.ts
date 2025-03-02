import { Command } from '../../command';

export class CommandIsNotInTemp extends Command {
  public item!: string;

  public qty?: number;

  public override execute() {
    if (this.bot.tempInventory.contains(this.item, this.qty)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is not in temp inventory: ${this.item} [x${this.qty}]`;
  }
}
