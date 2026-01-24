import { Command } from "../../command";

export class CommandAcceptQuest extends Command {
  public questId!: number;

  public override async executeImpl() {
    await this.bot.quests.accept(this.questId);
  }

  public override toString() {
    return `Accept quest: ${this.questId}`;
  }
}
