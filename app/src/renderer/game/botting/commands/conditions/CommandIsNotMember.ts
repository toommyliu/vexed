import { Command } from "@botting/command";

export class CommandIsNotMember extends Command {
  public override skipDelay = true;

  public override execute() {
    if (this.bot.player.isMember()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return "Is not member";
  }
}
