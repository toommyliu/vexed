import { Command } from "../../command";

export class CommandSettingDisableDeathAds extends Command {
  public state: boolean = false;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.disableDeathAds = this.state;
  }

  public override toString() {
    return `${this.state ? "Disable" : "Enable"} death ads`;
  }
}
