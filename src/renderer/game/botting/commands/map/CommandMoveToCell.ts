import { Command } from '../../command';

export class CommandMoveToCell extends Command {
	public cell!: string;

	public pad = 'Spawn';

	public override async execute() {
		await this.bot.world.jump(this.cell, this.pad);
	}

	public override toString() {
		return `Move to cell: ${this.cell} [${this.pad}]`;
	}
}
