import { Command } from '../../command';

export class CommandEnableAntiCounter extends Command {
  public override execute() {
    this.bot.settings.counterAttack = true;
  }

  public override toString() {
    return 'Enable anti-counter attack';
  }
}
