import { Command } from '../command';

export class DepositCommand extends Command {
	public override id = 'bank:deposit';

	public override async execute(item: number | string) {
		await this.bot.bank.deposit(item);
	}
}
