import { ConditionCommand } from "./ConditionCommand";

export class CommandQuestCanNotComplete extends ConditionCommand {
  public questId!: number;

  public override async getCondition(): Promise<boolean> {
    return !this.bot.flash.call(() => swf.questsCanCompleteQuest(this.questId));
  }

  public override toString() {
    return `Quest cannot complete: ${this.questId}`;
  }
}
