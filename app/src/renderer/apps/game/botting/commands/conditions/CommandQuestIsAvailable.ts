import { ConditionCommand } from "./ConditionCommand";

export class CommandQuestIsAvailable extends ConditionCommand {
  public questId!: number;

  public override async getCondition(): Promise<boolean> {
    return this.bot.flash.call(() => swf.questsIsAvailable(this.questId));
  }

  public override toString() {
    return `Quest is available: ${this.questId}`;
  }
}
