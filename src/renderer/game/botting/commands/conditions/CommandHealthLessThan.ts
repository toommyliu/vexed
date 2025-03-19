import { Command } from '../../command';

export class CommandHealthLessThan extends Command {
  public health!: number;

  public override execute() {
    if (this.bot.player.hp >= this.health) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `HP is less than: ${this.health}`;
  }
}
