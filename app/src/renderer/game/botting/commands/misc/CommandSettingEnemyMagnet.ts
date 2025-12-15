import { Command } from "~/botting/command";

export class CommandSettingEnemyMagnet extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.enemyMagnet = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: enemy magnet`;
  }
}
