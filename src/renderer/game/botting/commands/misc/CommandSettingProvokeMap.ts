import { Command } from "../../command";

export class CommandSettingProvokeMap extends Command {
  public state!: boolean;

  public override skipDelay = true;

  public override execute() {
    this.bot.settings.provokeMap = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: provoke map`;
  }
}
