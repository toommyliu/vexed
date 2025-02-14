import { Command } from '../../command';

export class CommandIsMember extends Command {
	public override execute() {
		if (!this.bot.player.isMember()) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return 'Is member';
	}
}
