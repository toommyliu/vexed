import { ConditionCommand } from "./ConditionCommand";

export class CommandCellIs extends ConditionCommand {
  public cell!: string;

  public override async getCondition() {
    return this.bot.player.cell.toLowerCase() === this.cell.toLowerCase();
  }

  public override toString() {
    return `Cell is: ${this.cell}`;
  }
}
