import { Command } from '../command';

export class CommandCellIs extends Command {
	public override id = 'misc:cell-is';

	public cell!: string;

	public override async execute() {
		if (this.bot.player.cell.toLowerCase() !== this.cell.toLowerCase()) {
			window.context.commandIndex++;
		}
	}

	public override toString() {
		return `Cell is: ${this.cell}`;
	}
}
