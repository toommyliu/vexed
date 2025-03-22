import { Command } from '../../command';

export class CommandRegisterDrop extends Command {
  public item!: string;

  public override execute() {
    this.ctx.addItem(this.item);
  }

  public override toString() {
    return `Add drop: ${this.item}`;
  }
}
