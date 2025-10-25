import { Command } from "@botting/command";

export class CommandArmySetConfigCommand extends Command {
  public fileName!: string;

  public override skipDelay = true;

  public override execute() {
    this.bot.army.setConfigName(this.fileName.toLowerCase());
    this.logger.debug(`Using config: ${this.fileName}`);
  }

  public override toString() {
    return `Army set config name: ${this.fileName}`;
  }
}
