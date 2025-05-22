import { Command } from "../../command";

export class CommandNotInCombat extends Command {
  public override skipDelay = true;

  public override execute() {
    if (this.bot.player.isInCombat()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return "Is not in combat";
  }
}
