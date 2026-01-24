import { ConditionCommand } from "./ConditionCommand";

export class CommandCellPlayerCountLessThan extends ConditionCommand {
  public cell!: string;

  public count!: number;

  public override async getCondition(): Promise<boolean> {
    const cellToUse = (this.cell ?? this.bot.player.cell).toLowerCase();
    let cellCount = 0;

    for (const player of this.bot.world.playerNames) {
      const isSameCell = this.bot.flash.call(() =>
        swf.worldIsPlayerInCell(player, cellToUse),
      );

      if (isSameCell) cellCount++;
    }

    return cellCount < this.count;
  }

  public override toString() {
    return `Cell player count less than: ${this.count}`;
  }
}
