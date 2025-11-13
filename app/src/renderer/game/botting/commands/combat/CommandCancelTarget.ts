import { Command } from "@botting/command";

export class CommandCancelTarget extends Command {
  public override executeImpl() {
    this.bot.combat.cancelAutoAttack();
    this.bot.combat.cancelTarget();
  }

  public override toString() {
    return "Cancel target";
  }
}
