import { Command } from '../../command';

export class CommandUnregisterBoost extends Command {
  public item!: string;

  public override execute() {
    this.ctx.unregisterBoost(this.item);
  }

  public override toString() {
    return `Unregister boost: ${this.item}`;
  }
}
