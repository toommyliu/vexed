import { Command } from '../../command';

export class CommandQuestCanComplete extends Command {
	public questId!: number;

	public override execute() {
		if (
			!this.bot.flash.call(() => swf.questsCanCompleteQuest(this.questId))
		) {
			this.ctx.commandIndex++;
		}
	}

	public override toString() {
		return `Quest [${this.questId}] can complete`;
	}
}
