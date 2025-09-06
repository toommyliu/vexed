import { ConditionCommand } from "./ConditionCommand";

export class CommandNotInCombat extends ConditionCommand {
  public override async getCondition(): Promise<boolean> {
    return !this.bot.player.isInCombat();
  }

  public override toString() {
    return "Is not in combat";
  }
}
