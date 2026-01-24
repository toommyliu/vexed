import { Command } from "../../command";

export type QuestRegistration = {
  itemId?: number;
  questId: number;
};

export class CommandRegisterQuest extends Command {
  public quests!: QuestRegistration[];

  protected override _skipDelay = true;

  public override executeImpl() {
    for (const quest of this.quests) {
      this.bot.environment.addQuestId(quest.questId);
      if (quest.itemId !== undefined) {
        this.bot.environment.setQuestItemId(quest.questId, quest.itemId);
      }

      this.logger.debug(
        quest.itemId === undefined
          ? `Register quest: ${quest.questId}`
          : `Register quest: ${quest.questId} (itemId: ${quest.itemId})`,
      );
    }
  }

  public override toString() {
    if (this.quests.length === 1) {
      const quest = this.quests[0]!;
      const itemPart =
        quest.itemId === undefined ? "" : ` (itemId: ${quest.itemId})`;
      return `Register quest: ${quest.questId}${itemPart}`;
    }

    return `Register quests: ${this.quests.map((quest) => quest.questId).join(", ")}`;
  }
}
