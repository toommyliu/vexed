import { ConditionCommand } from "./ConditionCommand";

export class CommandIsNotMember extends ConditionCommand {
  public override skipDelay = true;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.player.isMember();
  }

  public override toString() {
    return "Is not member";
  }
}
