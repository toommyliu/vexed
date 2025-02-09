import { Command } from '../command';

export class CommandReject extends Command {
	public override id = 'drops:reject';

	public item!: number | string;

	public override async execute() {
		await this.bot.drops.reject(this.item);
	}

	public override toString() {
		return `Reject drop: ${this.item}`;
	}
}
