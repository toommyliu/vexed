import { Command } from '../command';

export class SetDelayCommand extends Command {
	public override id = 'bot:set-delay';

	public delay!: number;

	public override execute() {
		this.bot.executor.setDelay(this.delay);
	}

	public override toString() {
		return `Set delay: ${this.delay}ms`;
	}
}
