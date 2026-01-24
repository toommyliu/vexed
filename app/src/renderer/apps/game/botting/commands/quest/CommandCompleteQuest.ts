import { Command } from "~/botting/command";

export class CommandCompleteQuest extends Command {
  public questId!: number;

  public itemId?: number;

  public override async executeImpl() {
    await this.bot.quests.complete(this.questId, 1, this.itemId ?? -1);
  }

  public override toString() {
    const itemPart = this.itemId === undefined ? "" : `:${this.itemId}`;
    return `Complete quest: ${this.questId}${itemPart}`;
  }
}
