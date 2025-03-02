import { Command } from '../../command';

export class CommandEquipped extends Command {
  public item!: string;

  public override execute() {
    if (!this.bot.inventory.get(this.item)?.isEquipped()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is equipped: ${this.item}`;
  }
}
