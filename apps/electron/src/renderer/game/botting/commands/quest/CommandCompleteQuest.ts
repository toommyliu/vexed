import { Command } from "@botting/command";

export class CommandCompleteQuest extends Command {
  public questId!: number;

  public override async execute(): Promise<void> {
    await this.bot.quests.complete(this.questId);
  }

  public override toString() {
    return `Complete quest: ${this.questId}`;
  }
}
