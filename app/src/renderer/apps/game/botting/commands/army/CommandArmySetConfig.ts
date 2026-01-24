import { Command } from "../../command";

export class CommandArmySetConfigCommand extends Command {
  public fileName!: string;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.army.setConfigName(this.fileName.toLowerCase());
    this.logger.debug(`Using config: ${this.fileName}.`);
  }

  public override toString() {
    return `Army set config name: ${this.fileName}`;
  }
}
