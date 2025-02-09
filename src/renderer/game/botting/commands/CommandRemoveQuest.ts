import { Command } from '../command';

export class CommandRemoveQuest extends Command {
	public override id = 'quest:remove';

	public questId!: number;

	public override execute() {
		window.context.removeQuest(this.questId);
	}
}
