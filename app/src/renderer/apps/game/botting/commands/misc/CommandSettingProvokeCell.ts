import { Command } from "~/botting/command";

export class CommandSettingProvokeCell extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.provokeCell = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: provoke cell`;
  }
}
