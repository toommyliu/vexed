import { Command } from "../../command";

export class CommandSettingDisableFx extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.disableFx = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: FX`;
  }
}
