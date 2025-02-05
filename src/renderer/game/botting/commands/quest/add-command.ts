import { Command } from '../command';

export class AddCommand extends Command {
	public override id = 'quest:add';

	public questId!: number;

	public override execute() {
		window.context.addQuest(this.questId);
	}
}
