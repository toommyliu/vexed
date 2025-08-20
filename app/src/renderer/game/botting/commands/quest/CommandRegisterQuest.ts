import { Command } from "@botting/command";

export class CommandRegisterQuest extends Command {
  public questIds!: (number | string)[];

  public override skipDelay = true;

  public override execute() {
    for (const questId of this.questIds)
      this.bot.environment.addQuestId(questId);
  }

  public override toString() {
    if (this.questIds.length === 1) {
      return `Register quest: ${this.questIds[0]}`;
    }

    return `Register quests: ${this.questIds.join(", ")}`;
  }
}
