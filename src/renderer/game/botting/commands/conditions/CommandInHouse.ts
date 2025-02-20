import { Command } from '../../command';

export class CommandInHouse extends Command {
	public item!: string;

	public qty?: number;

	public override execute() {
		if (
			(this.bot.house.get(this.item)?.quantity ?? -1) <= (this.qty ?? 1)
		) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return 'In house';
	}
}
