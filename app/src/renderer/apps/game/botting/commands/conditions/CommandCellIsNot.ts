import { ConditionCommand } from "./ConditionCommand";

export class CommandCellIsNot extends ConditionCommand {
  public cell!: string;

  public override async getCondition() {
    return this.bot.player.cell.toLowerCase() !== this.cell.toLowerCase();
  }

  public override toString() {
    return `Cell is not: ${this.cell}`;
  }
}
