import { Command } from '../command';

export class DepositCommand extends Command {
	public override id = 'bank:deposit';

	public item!: number | string;

	public override async execute() {
		await this.bot.bank.deposit(this.item);
	}

	public override toString() {
		return `Deposit: ${this.item}`;
	}
}
