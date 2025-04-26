import { Command } from "../../command";

export class CommandArmySetConfigCommand extends Command {
  public fileName!: string;

  public override execute() {
    const cleanName = this.fileName.startsWith("storage/")
      ? this.fileName
      : `storage/${this.fileName}`;

    this.bot.army.setConfigName(cleanName);
  }

  public override toString() {
    return `Set config name: ${this.fileName}`;
  }
}
