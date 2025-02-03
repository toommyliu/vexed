import { Command } from '../command';

export class MoveToCellCommand extends Command {
	public override id = 'world:move-to-cell';

	public cell!: string;

	public pad = 'Spawn';

	public override async execute() {
		await this.bot.world.jump(this.cell, this.pad);
	}

	public override toString() {
		return `Move to cell: ${this.cell} [${this.pad}]`;
	}
}
