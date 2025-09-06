import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerIsInCell extends ConditionCommand {
  public player!: string;

  public cell!: string;

  public override async getCondition(): Promise<boolean> {
    return this.bot.flash.call(() =>
      swf.worldIsPlayerInCell(this.player, this.cell),
    );
  }

  public override toString() {
    return `${this.player ?? "This player"} is in cell: ${this.cell}`;
  }
}
