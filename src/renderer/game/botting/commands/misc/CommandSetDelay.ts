import { Command } from '../../command';

export class CommandSetDelay extends Command {
	public delay!: number;

	public override execute() {
		this.ctx.setCommandDelay(this.delay);
	}

	public override toString() {
		return `Set delay: ${this.delay}ms`;
	}
}
