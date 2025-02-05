import { Command } from '../command';

export class SwapCommand extends Command {
	public override id = 'bank:swap';

	public bankItem!: number | string;

	public invItem!: number | string;

	public override async execute() {
		await this.bot.bank.swap(this.bankItem, this.invItem);
	}

	public override toString() {
		return `Swap: ${this.bankItem} [bank] ${this.invItem} [inv]`;
	}
}
