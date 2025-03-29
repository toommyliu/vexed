import { Command } from '../../command';

export class CommandUnregisterDrop extends Command {
  public item!: string;

  public override execute() {
    this.ctx.unregisterDrop(this.item);
  }

  public override toString() {
    return `Unregister drop: ${this.item}`;
  }
}
