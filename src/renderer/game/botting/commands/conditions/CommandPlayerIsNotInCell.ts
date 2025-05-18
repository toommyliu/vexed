import { Command } from "../../command";

export class CommandPlayerIsNotInCell extends Command {
  public player!: string;

  public cell!: string;

  public override execute() {
    if (
      this.bot.flash.call(() => swf.worldIsPlayerInCell(this.player, this.cell))
    ) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `${this.player ?? "This player"} is not in cell: ${this.cell}`;
  }
}
