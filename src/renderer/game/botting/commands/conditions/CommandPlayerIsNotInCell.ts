import { Command } from '../../command';

export class CommandPlayerIsNotInCell extends Command {
  public name!: string;

  public cell!: string;

  public override execute() {
    if (
      this.bot.flash.call(() => swf.worldIsPlayerInCell(this.name, this.cell))
    ) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Player [${this.name}] is not in cell [${this.cell}]`;
  }
}
