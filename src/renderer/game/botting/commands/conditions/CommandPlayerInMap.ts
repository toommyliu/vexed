import { Command } from '../../command';

export class CommandPlayerInMap extends Command {
  public name!: string;

  public override execute() {
    if (!this.bot.world.playerNames.includes(this.name)) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player is in map: ${this.name}`;
  }
}
