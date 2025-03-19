import { Command } from '../../command';

export class CommandHealthGreaterThan extends Command {
  public health!: number;

  public override execute() {
    if (this.bot.player.hp <= this.health) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `HP is greater than: ${this.health}`;
  }
}
