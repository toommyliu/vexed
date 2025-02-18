import { Command } from '../../command';

export class CommandQuestIsNotAvailable extends Command {
	public questId!: number;

	public override execute() {
		if (this.bot.flash.call(() => swf.questsIsAvailable(this.questId))) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return `If quest [${this.questId}] is not available`;
	}
}
