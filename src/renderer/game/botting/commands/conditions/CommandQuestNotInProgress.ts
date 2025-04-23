import { Command } from "../../command";

export class CommandQuestNotInProgress extends Command {
  public questId!: number;

  public override execute() {
    if (this.bot.flash.call(() => swf.questsIsInProgress(this.questId))) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Quest is not in progress: ${this.questId}`;
  }
}
