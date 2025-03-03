import { Command } from '../../command';

export class CommandItemHasDropped extends Command {
  public item!: string;

  public override execute() {
    if (!this.bot.drops.hasDrop(this.item)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item has dropped: ${this.item}`;
  }
}
