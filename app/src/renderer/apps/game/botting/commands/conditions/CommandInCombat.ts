import { ConditionCommand } from "./ConditionCommand";

export class CommandInCombat extends ConditionCommand {
  public override async getCondition(): Promise<boolean> {
    return this.bot.player.isInCombat();
  }

  public override toString() {
    return "Is in combat";
  }
}
