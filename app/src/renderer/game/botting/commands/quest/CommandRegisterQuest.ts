import { Command } from "@botting/command";

export class CommandRegisterQuest extends Command {
  public questIds!: (number | string)[];

  protected override _skipDelay = true;

  public override executeImpl() {
    for (const questId of this.questIds) {
      this.bot.environment.addQuestId(questId);
      this.logger.debug(`Register quest: ${questId}`);
    }
  }

  public override toString() {
    if (this.questIds.length === 1) {
      return `Register quest: ${this.questIds[0]}`;
    }

    return `Register quests: ${this.questIds.join(", ")}`;
  }
}
