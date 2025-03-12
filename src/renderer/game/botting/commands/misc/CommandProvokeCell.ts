import { Command } from '../../command';

export class CommandProvokeCell extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.provokeCell = this.state;
  }

  public override toString() {
    return `${this.state ? 'Enable' : 'Disable'} provoke cell`;
  }
}
