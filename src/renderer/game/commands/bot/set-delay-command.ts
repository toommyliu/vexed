import { Command } from '../command';

export class SetDelayCommand extends Command {
	public override id = 'bot:set-delay';

	public override execute(delay: number) {
		this.bot.commandsQueue.setDelay(delay);
	}
}
