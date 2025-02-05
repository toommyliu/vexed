import { Command } from '../command';

export class PickupCommand extends Command {
	public override id = 'drops:pickup';

	public item!: number | string;

	public override async execute() {
		await this.bot.drops.pickup(this.item);
	}

	public override toString() {
		return `Pickup drop: ${this.item}`;
	}
}
