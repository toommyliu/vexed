import { Command } from '../../command';

export class CommandInTemp extends Command {
	public item!: string;

	public qty?: number;

	public override execute() {
		if (
			(this.bot.tempInventory.get(this.item)?.quantity ?? -1) <=
			(this.qty ?? 1)
		) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return `Is in temp ${this.item} [x${this.qty ?? 1}]`;
	}
}
