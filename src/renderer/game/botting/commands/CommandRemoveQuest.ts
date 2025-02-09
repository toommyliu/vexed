import { Command } from '../command';

export class CommandRemoveQuest extends Command {
	public questId!: number;

	public override execute() {
		this.ctx.removeQuest(this.questId);
	}

	public override toString() {
		return `Remove quest: ${this.questId}`;
	}
}
