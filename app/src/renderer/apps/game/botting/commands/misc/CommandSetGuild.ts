import { Command } from "~/botting/command";

export class CommandSetGuild extends Command {
  public guild!: string;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.customGuild = this.guild;
  }

  public override toString() {
    return `Set guild: ${this.guild}`;
  }
}
