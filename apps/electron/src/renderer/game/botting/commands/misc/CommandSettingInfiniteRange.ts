import { Command } from "@botting/command";

export class CommandSettingInfiniteRange extends Command {
  public state!: boolean;

  public override skipDelay = true;

  public override execute() {
    this.bot.settings.infiniteRange = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: infinite range`;
  }
}
