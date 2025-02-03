import { Command } from '../command';

export class AttackCommand extends Command {
	public override id = 'combat:attack';

	public target!: string;

	public override execute() {
		this.bot.combat.attack(this.target);
	}

	public override toString() {
		return `Attack: ${this.target}`;
	}
}
