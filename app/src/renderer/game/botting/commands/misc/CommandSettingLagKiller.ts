import { Command } from "~/botting/command";

export class CommandSettingLagKiller extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.lagKiller = this.state;
    this.bot.flash.call(() => swf.settingsLagKiller(!this.state));
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: lag killer`;
  }
}
