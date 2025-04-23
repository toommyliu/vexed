import { Command } from "../../command";

export class CommandRegisterQuest extends Command {
  public questId!: number;

  public override execute() {
    this.ctx.registerQuest(this.questId);
  }

  public override toString() {
    return `Register quest: ${this.questId}`;
  }
}
