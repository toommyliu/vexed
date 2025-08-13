import { Command } from "../../command";

export class CommandSettingLagKiller extends Command {
  public state!: boolean;

  public override skipDelay = true;

  public override execute() {
    this.bot.settings.lagKiller = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: lag killer`;
  }
}
