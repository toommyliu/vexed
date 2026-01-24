import { ConditionCommand } from "./ConditionCommand";

export class CommandIsMember extends ConditionCommand {
  public override async getCondition() {
    return this.bot.player.isMember();
  }

  public override toString() {
    return "Is member";
  }
}
