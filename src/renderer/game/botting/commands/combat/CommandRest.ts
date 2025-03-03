import { Command } from '../../command';

export class CommandRest extends Command {
  public override async execute(): Promise<void> {
    await this.bot.combat.rest();
  }

  public override toString() {
    return 'Rest';
  }
}
