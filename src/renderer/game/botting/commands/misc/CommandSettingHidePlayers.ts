import { Command } from "../../command";

export class CommandSettingHidePlayers extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.hidePlayers = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: hide players`;
  }
}
