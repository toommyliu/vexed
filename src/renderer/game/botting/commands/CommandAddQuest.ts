import { Command } from '../command';

export class CommandAddQuest extends Command {
	public override id = 'quest:add';

	public questId!: number;

	public override execute() {
		window.context.addQuest(this.questId);
	}
}
