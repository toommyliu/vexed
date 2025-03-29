import { Command } from '../../command';

export class CommandSettingSkipCutscenes extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.skipCutscenes = this.state;
  }

  public override toString() {
    return `${this.state ? 'Enable' : 'Disable'} setting: skip cutscenes`;
  }
}
