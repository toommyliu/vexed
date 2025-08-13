import { Command } from "../../command";

export class CommandPlayerNameIs extends Command {
  public player!: string;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.auth.username.toLowerCase() !== this.player.toLowerCase()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `This player name is: ${this.player}`;
  }
}
