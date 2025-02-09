import { Command } from '../command';

export class CommandSwap extends Command {
	public bankItem!: number | string;

	public invItem!: number | string;

	public override async execute() {
		await this.bot.bank.swap(this.bankItem, this.invItem);
	}

	public override toString() {
		return `Swap: ${this.bankItem} [bank] ${this.invItem} [inv]`;
	}
}
