import { ConditionCommand } from "./ConditionCommand";

export class CommandIsNotMember extends ConditionCommand {
  protected override _skipDelay = true;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.player.isMember();
  }

  public override toString() {
    return "Is not member";
  }
}
