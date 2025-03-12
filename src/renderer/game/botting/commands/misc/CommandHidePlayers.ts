import { Command } from '../../command';

export class CommandHidePlayers extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.hidePlayers = this.state;
  }

  public override toString() {
    return `${this.state ? 'Enable' : 'Disable'} hide players`;
  }
}
