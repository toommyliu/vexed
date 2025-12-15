import { Command } from "~/botting/command";

export class CommandSettingHidePlayers extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.hidePlayers = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: hide players`;
  }
}
