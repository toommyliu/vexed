import { Command } from "@botting/command";

export class CommandQuestCanNotComplete extends Command {
  public questId!: number;

  public override skipDelay = true;

  public override execute() {
    if (this.bot.flash.call(() => swf.questsCanCompleteQuest(this.questId))) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Quest cannot complete: ${this.questId}`;
  }
}
