import { Command } from "~/botting/command";

export class CommandSetName extends Command {
  public name!: string;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.customName = this.name;
  }

  public override toString() {
    return `Set name: ${this.name}`;
  }
}
