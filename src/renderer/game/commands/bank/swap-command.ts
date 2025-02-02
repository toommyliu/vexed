import { Command } from '../command';

export class SwapCommand extends Command {
	public override id = 'bank:swap';

	public override async execute(
		bankItem: number | string,
		invItem: number | string,
	) {
		await this.bot.bank.swap(bankItem, invItem);
	}
}
