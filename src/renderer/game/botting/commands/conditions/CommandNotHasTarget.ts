import { Command } from '../../command';

export class CommandNotHasTarget extends Command {
	public override execute() {
		if (this.bot.combat.hasTarget()) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return 'Is not has target';
	}
}
