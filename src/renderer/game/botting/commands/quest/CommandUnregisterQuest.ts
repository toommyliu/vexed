import { Command } from "../../command";

export class CommandUnregisterQuest extends Command {
  public questIds!: number[];

  public override execute() {
    for (const questId of this.questIds) {
      this.ctx.unregisterQuest(questId);
    }
  }

  public override toString() {
    return `Unregister quests: ${this.questIds.join(", ")}`;
  }
}
