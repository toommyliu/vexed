import { Command } from "../../command";

export class CommandArmySetConfigCommand extends Command {
  public fileName!: string;

  public override execute() {
    this.bot.army.setConfigName(this.fileName);
  }

  public override toString() {
    return `Set config name: ${this.fileName}`;
  }
}
