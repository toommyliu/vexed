import { Command } from "../../command";

export class CommandCellPlayerCountLessThan extends Command {
  public cell!: string;

  public count!: number;

  public override skipDelay = true;

  public override execute() {
    const cellToUse = (this.cell ?? this.bot.player.cell).toLowerCase();
    let cellCount = 0;

    for (const player of this.bot.world.playerNames) {
      const isSameCell = this.bot.flash.call(() =>
        swf.worldIsPlayerInCell(player, cellToUse),
      );

      if (isSameCell) cellCount++;
    }

    if (cellCount >= this.count) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Cell player count less than: ${this.count}`;
  }
}
