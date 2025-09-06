import { ConditionCommand } from "./ConditionCommand";

export class CommandIsPlayerArmyMember extends ConditionCommand {
  public override async getCondition(): Promise<boolean> {
    return this.bot.army.isInitialized && !this.bot.army.isLeader();
  }

  public override toString() {
    return "Is player army member";
  }
}
