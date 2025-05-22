import { Command } from "../../command";

export class CommandLevelIsLessThan extends Command {
  public level!: number;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.player.level >= this.level) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Level is less than: ${this.level}`;
  }
}
