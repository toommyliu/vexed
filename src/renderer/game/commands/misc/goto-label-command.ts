import { Command } from '../command';

export class GotoLabelCommand extends Command {
	public override id = 'misc:goto-label';

	public label!: string;

	public override execute() {
		const jmpIndex = this.bot.executor.labels.get(this.label);
		if (jmpIndex === undefined) return;

		// jmpIndex - 1 goes to the label definition
		this.bot.executor.index = jmpIndex - 1;
	}

	public override toString() {
		return `Goto label: ${this.label}`;
	}
}
