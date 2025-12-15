import { Command } from "~/botting/command";

export class CommandUnregisterQuest extends Command {
  public questIds!: (number | string)[];

  protected override _skipDelay = true;

  public override executeImpl() {
    for (const questId of this.questIds) {
      this.bot.environment.removeQuestId(questId);
      this.logger.debug(`Unregister quest: ${questId}`);
    }
  }

  public override toString() {
    if (this.questIds.length === 1) {
      return `Unregister quest: ${this.questIds[0]}`;
    }

    return `Unregister quests: ${this.questIds.join(", ")}`;
  }
}
