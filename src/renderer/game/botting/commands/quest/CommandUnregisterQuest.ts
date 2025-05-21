import { Command } from "../../command";

export class CommandUnregisterQuest extends Command {
  public questId!: number;

  public override execute() {
    this.ctx.unregisterQuest(this.questId);
  }

  public override toString() {
    return `Unregister quest: ${this.questId}`;
  }
}
