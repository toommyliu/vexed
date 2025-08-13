import { Command } from "../../command";

export class CommandSetName extends Command {
  public name!: string;

  public override skipDelay = true;

  public override execute() {
    this.bot.settings.customName = this.name;
  }

  public override toString() {
    return `Set name: ${this.name}`;
  }
}
