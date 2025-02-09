import { Command } from '../command';

export class CommandPickup extends Command {
	public item!: number | string;

	public override async execute() {
		await this.bot.drops.pickup(this.item);
	}

	public override toString() {
		return `Pickup: ${this.item}`;
	}
}
