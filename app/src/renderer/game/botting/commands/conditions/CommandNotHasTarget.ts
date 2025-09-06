import { ConditionCommand } from "./ConditionCommand";

export class CommandNotHasTarget extends ConditionCommand {
  public override async getCondition(): Promise<boolean> {
    return !this.bot.combat.hasTarget();
  }

  public override toString() {
    return "Has no target";
  }
}
