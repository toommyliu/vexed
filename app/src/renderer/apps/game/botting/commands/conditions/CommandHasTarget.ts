import { ConditionCommand } from "./ConditionCommand";

export class CommandHasTarget extends ConditionCommand {
  protected override _skipDelay = true;

  public override async getCondition(): Promise<boolean> {
    return this.bot.combat.hasTarget();
  }

  public override toString() {
    return "Has target";
  }
}
