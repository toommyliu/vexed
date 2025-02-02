import { Command } from '../command';

export class AttackCommand extends Command {
	public override id = 'combat:attack';

	public override execute(monster: string) {
		this.bot.combat.attack(monster);
	}
}
