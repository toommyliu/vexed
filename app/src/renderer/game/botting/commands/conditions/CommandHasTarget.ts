import { ConditionCommand } from "./ConditionCommand";

export class CommandHasTarget extends ConditionCommand {
  public override skipDelay = true;

  public override async getCondition(): Promise<boolean> {
    return this.bot.combat.hasTarget();
  }

  public override toString() {
    return "Has target";
  }
}
