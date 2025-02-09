import { Command } from '../command';

export class CommandBuy extends Command {
	public override id = 'shop:buy';

	public shopId!: number;

	public item!: number | string;

	public quantity!: number;

	public override async execute() {
		await this.bot.shops.load(this.shopId);

		if (typeof this.item === 'number') {
			await this.bot.shops.buyById(this.item, this.quantity);
		} else {
			await this.bot.shops.buyByName(this.item, this.quantity);
		}
	}

	public override toString() {
		return `Buy item: ${this.quantity}x ${this.item}`;
	}
}
