import { Command } from "@botting/command";

export class CommandQuestIsAvailable extends Command {
  public questId!: number;

  public override skipDelay = true;

  public override execute() {
    if (!this.bot.flash.call(() => swf.questsIsAvailable(this.questId))) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Quest is available: ${this.questId}`;
  }
}
