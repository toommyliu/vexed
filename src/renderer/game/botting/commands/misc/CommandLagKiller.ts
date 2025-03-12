import { Command } from '../../command';

export class CommandLagKiller extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.lagKiller = this.state;
  }

  public override toString() {
    return `${this.state ? 'Enable' : 'Disable'} lag killer`;
  }
}
