import { Command } from "@botting/command";

export class CommandSettingInfiniteRange extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.infiniteRange = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: infinite range`;
  }
}
