import { Command } from '../../command';

export class CommandSettingAntiCounter extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.counterAttack = this.state;
  }

  public override toString() {
    return `${this.state ? 'Enable' : 'Disable'} setting: anti counter`;
  }
}
