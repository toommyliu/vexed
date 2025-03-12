import { Command } from '../../command';

export class CommandProvokeMap extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.provokeMap = this.state;
  }

  public override toString() {
    return `${this.state ? 'Enable' : 'Disable'} provoke map`;
  }
}
