import { Command } from "@botting/command";

export class CommandSettingSkipCutscenes extends Command {
  public state!: boolean;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.skipCutscenes = this.state;
  }

  public override toString() {
    return `${this.state ? "Enable" : "Disable"} setting: skip cutscenes`;
  }
}
