import { Command } from '../../command';

export class CellIsNotCommand extends Command {
	public override id = 'misc:cell-is-not';

	public cell!: string;

	public override async execute() {
		if (this.bot.player.cell.toLowerCase() === this.cell.toLowerCase()) {
			this.bot.executor.index++;
		}
	}

	public override toString() {
		return `Cell is not: ${this.cell}`;
	}
}
