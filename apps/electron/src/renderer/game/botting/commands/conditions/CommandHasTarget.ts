import { Command } from "@botting/command";

export class CommandHasTarget extends Command {
  public override skipDelay = true;

  public override execute() {
    if (!this.bot.combat.hasTarget()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return "Has target";
  }
}
