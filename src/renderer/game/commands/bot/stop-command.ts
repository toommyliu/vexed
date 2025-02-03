import { Command } from '../command';

export class StopCommand extends Command {
	public override id = 'bot:stop';

	public override async execute() {
		await this.bot.executor.stop();
	}

	public override toString(): string {
		return 'Stop bot';
	}
}
