import { Command } from "../../command";

export class CommandSetGuild extends Command {
  public guild!: string;

  public override skipDelay = true;

  public override execute() {
    this.bot.settings.customGuild = this.guild;
  }

  public override toString() {
    return `Set guild: ${this.guild}`;
  }
}
