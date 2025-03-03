import { Command } from '../../command';

export class CommandCellIsNot extends Command {
  public cell!: string;

  public override async execute() {
    if (this.bot.player.cell.toLowerCase() === this.cell.toLowerCase()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Cell is not: ${this.cell}`;
  }
}
