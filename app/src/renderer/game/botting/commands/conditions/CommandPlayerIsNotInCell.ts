import { ConditionCommand } from "./ConditionCommand";

export class CommandPlayerIsNotInCell extends ConditionCommand {
  public player!: string;

  public cell!: string;

  public override async getCondition(): Promise<boolean> {
    // return !this.bot.flash.call(() =>
    //   swf.worldIsPlayerInCell(this.player, this.cell),
    // );

    return !this.bot.world.players.getByName(this.player)?.isInCell(this.cell);
  }

  public override toString() {
    return `${this.player ?? "This player"} is not in cell: ${this.cell}`;
  }
}
