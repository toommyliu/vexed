import { Command } from '../../command';

export class CommandExitCombat extends Command {
  public override async execute(): Promise<void> {
    await this.bot.combat.exit(true);
  }

  public override toString() {
    return 'Exit from combat';
  }
}
