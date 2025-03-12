import { Command } from '../../command';

export class CommandEnemyMagnet extends Command {
  public state!: boolean;

  public override execute() {
    this.bot.settings.enemyMagnet = this.state;
  }

  public override toString() {
    return `${this.state ? 'Enable' : 'Disable'} enemy magnet`;
  }
}
