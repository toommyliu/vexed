import { equalsIgnoreCase } from "@vexed/utils/string";
import { ConditionCommand } from "./ConditionCommand";

export class CommandCellPlayerCountGreaterThan extends ConditionCommand {
  public cell!: string;

  public count!: number;

  public override async getCondition() {
    const cellToUse = (this.cell ?? this.bot.player.cell).toLowerCase();
    let cellCount = 0;

    for (const player of this.bot.world.players.all().values()) {
      if (equalsIgnoreCase(player.cell, cellToUse)) cellCount++;
    }

    return cellCount > this.count;
  }

  public override toString() {
    return `Cell player count greater than: ${this.count}`;
  }
}
