import { Command } from '../../command';

export class CommandCellPlayerCountGreaterThan extends Command {
  public count!: number;

  public override execute() {
    let cellCount = 0;

    for (const player of this.bot.world.playerNames) {
      const isSameCell =
        this.bot.player.cell ===
        this.bot.world.players?.get(player)?.data?.strFrame;
      if (isSameCell) cellCount++;
    }

    if (cellCount <= this.count) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Cell player count greater than: ${this.count}`;
  }
}
