import { Command } from '../command';
import { LabelCommand } from './label-command';

export class GotoLabelCommand extends Command {
	public override id = 'misc:goto-label';

	public label!: string;

	public override execute() {
		const index = this.bot.executor.commands.findIndex(
			(cmd) =>
				cmd instanceof LabelCommand &&
				cmd.label.toLowerCase() === this.label.toLowerCase(),
		);

		if (index > -1) {
			this.bot.executor.index = index;
		}
	}

	public override toString() {
		return `Goto label: ${this.label}`;
	}
}
