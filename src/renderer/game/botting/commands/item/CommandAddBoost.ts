import { Command } from '../../command';

export class CommandAddBoost extends Command {
  public item!: string;

  public override execute() {
    this.ctx.addBoost(this.item);
  }

  public override toString() {
    return `Add boost: ${this.item}`;
  }
}
