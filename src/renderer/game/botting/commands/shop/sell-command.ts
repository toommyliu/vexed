import { Command } from '../command';

export class SellCommand extends Command {
	public override id = 'shop:sell';

	public item!: string;

	public override async execute() {
		await this.bot.shops.sell(this.item);
	}

	public override toString() {
		return `Sell item: ${this.item}`;
	}
}
