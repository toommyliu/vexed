import { Command } from "../../command";

export class CommandSettingAntiCounter extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.counterAttack = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: anti counter`;
  }
}
