import { Command } from '../command';

export class CommandKillFor extends Command {
	public target!: string;

	public item!: number | string;

	public quantity!: number;

	public isTemp: boolean = false;

	public override async execute() {
		try {
			if (this.isTemp) {
				await this.bot.combat.killForTempItem(
					this.target,
					this.item,
					this.quantity,
				);
			} else {
				await this.bot.combat.killForItem(
					this.target,
					this.item,
					this.quantity,
				);
			}
		} catch (error) {
			logger.error(error);
		}
	}

	public override toString(): string {
		return `Kill for${this.isTemp ? ' temp' : ''} item: ${this.target} ${this.item} ${this.quantity}`;
	}
}
