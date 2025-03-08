import { Command } from '../../command';

export class CommandRemoveDrop extends Command {
  public item!: string;

  public override execute() {
    this.ctx.removeItem(this.item);
  }

  public override toString() {
    return `Remove drop: ${this.item}`;
  }
}
