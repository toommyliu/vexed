import { Command } from '../command';

export class CompleteCommand extends Command {
	public override id = 'quest:complete';

	public override async execute(questId: number): Promise<void> {
		await this.bot.quests.complete(questId);
	}
}
