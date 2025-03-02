import { Command } from '../../command';

export class CommandPlayerIsNotInMap extends Command {
  public name!: string;

  public override execute() {
    if (this.bot.world.playerNames.includes(this.name)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player [${this.name}] is not in map`;
  }
}
