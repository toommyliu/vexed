import { Command } from '../../command';

export class CommandLevelGreaterThan extends Command {
  public level!: number;

  public override execute() {
    if (this.bot.player.level <= this.level) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Level is greater than: ${this.level}`;
  }
}
