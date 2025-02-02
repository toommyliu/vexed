import { Command } from '../command';

export class CancelTargetCommand extends Command {
	public override id = 'combat:cancel-target';

	public override execute() {
		this.bot.combat.cancelAutoAttack();
		this.bot.combat.cancelTarget();
	}
}
