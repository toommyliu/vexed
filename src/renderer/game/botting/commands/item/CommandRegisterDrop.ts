import { Command } from '../../command';

export class CommandRegisterDrop extends Command {
  public item!: string;

  public override execute() {
    this.ctx.registerDrop(this.item);
  }

  public override toString() {
    return `Add drop: ${this.item}`;
  }
}
