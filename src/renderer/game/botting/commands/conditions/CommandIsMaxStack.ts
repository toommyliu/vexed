import { Command } from '../../command';

export class CommandIsMaxStack extends Command {
  public item!: string;

  public override execute() {
    const item = this.bot.inventory.get(this.item);

    if (item?.isMaxed()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Is maxed out: ${this.item}`;
  }
}
