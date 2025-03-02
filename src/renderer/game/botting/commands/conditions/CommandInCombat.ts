import { PlayerState } from '../../../lib/Player';
import { Command } from '../../command';

export class CommandInCombat extends Command {
  public override execute() {
    if (this.bot.player.state !== PlayerState.InCombat) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return 'Is in combat';
  }
}
