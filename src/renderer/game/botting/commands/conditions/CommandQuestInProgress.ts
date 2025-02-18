import { Command } from '../../command';

export class CommandQuestInProgress extends Command {
	public questId!: number;

	public override execute() {
		if (!this.bot.flash.call(() => swf.questsIsInProgress(this.questId))) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return `If quest [${this.questId}] in progress`;
	}
}
