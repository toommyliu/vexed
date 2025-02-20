import { Command } from '../../command';

export class CommandAddQuest extends Command {
	public questId!: number;

	public override execute() {
		this.ctx.addQuest(this.questId);
	}

	public override toString() {
		return `Add quest: ${this.questId}`;
	}
}
