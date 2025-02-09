import { Command } from '../command';

export class CommandDeposit extends Command {
	public item!: number | string;

	public override async execute() {
		await this.bot.bank.deposit(this.item);
	}

	public override toString() {
		return `Deposit: ${this.item}`;
	}
}
