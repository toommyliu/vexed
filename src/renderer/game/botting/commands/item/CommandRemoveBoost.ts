import { Command } from '../../command';

export class CommandRemoveBoost extends Command {
  public item!: string;

  public override execute() {
    this.ctx.removeBoost(this.item);
  }

  public override toString() {
    return `Remove boost: ${this.item}`;
  }
}
