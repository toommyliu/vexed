import { Command } from '../command';

export class KillForCommand extends Command {
	public override id = 'combat:kill-for';

	public override async execute(
		monster: string,
		item: string,
		quantity: number,
		isTemp: boolean = false,
	) {
		if (isTemp) {
			await this.bot.combat.killForTempItem(monster, item, quantity);
		} else {
			await this.bot.combat.killForItem(monster, item, quantity);
		}
	}
}
