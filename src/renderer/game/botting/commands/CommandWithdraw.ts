import { Command } from '../command';

export class CommandWithdraw extends Command {
	public override id = 'bank:withdraw';

	public item!: number | string;

	public override async execute() {
		await this.bot.bank.withdraw(this.item);
	}

	public override toString() {
		return `Withdraw: ${this.item}`;
	}
}
