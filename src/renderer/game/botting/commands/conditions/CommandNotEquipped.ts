import { Command } from '../../command';

export class CommandNotEquipped extends Command {
  public item!: string;

  public override execute() {
    if (this.bot.inventory.get(this.item)?.isEquipped()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Item is not equipped: ${this.item}`;
  }
}
