import { Command } from "../../command";

export class CommandArmySetConfigCommand extends Command {
  public fileName!: string;

  public override skipDelay = true;

  public override execute() {
    const cleanName = this.fileName.startsWith("storage/")
      ? this.fileName
      : `storage/${this.fileName}`;

    this.bot.army.setConfigName(cleanName);
  }

  public override toString() {
    return `Army set config name: ${this.fileName}`;
  }
}
