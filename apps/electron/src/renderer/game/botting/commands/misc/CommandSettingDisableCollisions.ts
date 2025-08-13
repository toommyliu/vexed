import { Command } from "../../command";

export class CommandSettingDisableCollisions extends Command {
  public state!: boolean;

  public override skipDelay = true;

  public override execute() {
    this.bot.settings.disableCollisions = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: collisions`;
  }
}
