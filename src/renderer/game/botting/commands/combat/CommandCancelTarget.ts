import { Command } from '../../command';

export class CommandCancelTarget extends Command {
  public override execute() {
    this.bot.combat.cancelAutoAttack();
    this.bot.combat.cancelTarget();
  }

  public override toString() {
    return 'Cancel target';
  }
}
