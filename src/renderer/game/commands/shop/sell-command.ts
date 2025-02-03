import { Command } from '../command';

export class SellCommand extends Command {
	public override id = 'shop:sell';

	public override async execute(item: string) {
		await this.bot.shops.sell(item);
	}
}
