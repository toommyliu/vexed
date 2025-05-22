import { Command } from "../../command";

export class CommandUnregisterQuest extends Command {
  public questIds!: number[];

  public override skipDelay = true;

  public override execute() {
    for (const questId of this.questIds) {
      this.ctx.unregisterQuest(questId);
    }
  }

  public override toString() {
    if (this.questIds.length === 1) {
      return `Unregister quest: ${this.questIds[0]}`;
    }

    return `Unregister quests: ${this.questIds.join(", ")}`;
  }
}
