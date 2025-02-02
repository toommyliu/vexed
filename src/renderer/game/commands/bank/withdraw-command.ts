import { Command } from '../command';

export class WithdrawCommand extends Command {
	public override id = 'bank:withdraw';

	public override async execute(item: number | string) {
		await this.bot.bank.withdraw(item);
	}
}
