import { Command } from "../../command";

export class CommandSettingDisableCollisions extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.disableCollisions = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: collisions`;
  }
}
