import { Command } from '../../command';

export class CommandDisableFx extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.disableFx = this.state;
  }

  public override toString() {
    return `${this.state ? 'Enable' : 'Disable'} FX`;
  }
}
