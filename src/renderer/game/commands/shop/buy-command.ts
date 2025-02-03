import { Command } from '../command';

export class BuyCommand extends Command {
	public override id = 'shop:buy';

	public override async execute(
		shopId: number,
		item: number | string,
		quantity: number,
	) {
		await this.bot.shops.load(shopId);

		if (typeof item === 'number') {
			await this.bot.shops.buyById(item, quantity);
		} else {
			await this.bot.shops.buyByName(item, quantity);
		}
	}
}
