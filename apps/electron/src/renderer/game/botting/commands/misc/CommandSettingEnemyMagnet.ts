import { Command } from "@botting/command";

export class CommandSettingEnemyMagnet extends Command {
  public state!: boolean;

  public override skipDelay = true;

  public override execute() {
    this.bot.settings.enemyMagnet = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: enemy magnet`;
  }
}
