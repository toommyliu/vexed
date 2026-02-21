import { ConditionCommand } from "./ConditionCommand";

export class CommandQuestNotInProgress extends ConditionCommand {
  public questId!: number;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.flash.call(() => swf.questsIsInProgress(this.questId));
  }

  public override toString() {
    return `Quest is not in progress: ${this.questId}`;
  }
}
