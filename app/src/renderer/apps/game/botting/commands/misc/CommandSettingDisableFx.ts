import { Command } from "../../command";

export class CommandSettingDisableFx extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.disableFx = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: FX`;
  }
}
