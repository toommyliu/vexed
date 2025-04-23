import { Command } from "../../command";

export class CommandArmySetLogFileName extends Command {
  public fileName!: string;

  public override execute() {
    this.bot.army.setLogName(this.fileName);
  }

  public override toString() {
    return `Set log name: ${this.fileName}`;
  }
}
