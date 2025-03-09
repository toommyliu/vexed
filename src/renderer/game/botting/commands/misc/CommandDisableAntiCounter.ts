import { Command } from '../../command';

export class CommandDisableAntiCounter extends Command {
  public override execute() {
    this.bot.settings.counterAttack = false;
  }

  public override toString() {
    return 'Disable anti-counter attack';
  }
}
