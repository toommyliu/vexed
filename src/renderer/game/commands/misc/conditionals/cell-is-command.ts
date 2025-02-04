import { Command } from '../../command';

export class CellIsCommand extends Command {
	public override id = 'misc:cell-is';

	public cell!: string;

	public override async execute() {
		if (this.bot.player.cell.toLowerCase() !== this.cell.toLowerCase()) {
			this.bot.executor.index++;
		}
	}

	public override toString() {
		return `Cell is: ${this.cell}`;
	}
}
