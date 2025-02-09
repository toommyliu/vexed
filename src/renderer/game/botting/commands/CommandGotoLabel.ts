import { Command } from '../command';
import { LabelCommand } from './CommandLabel';

export class CommandGotoLabel extends Command {
	public override id = 'misc:goto-label';

	public label!: string;

	public override execute() {
		const index = window.context.commands.findIndex(
			(cmd) =>
				cmd instanceof LabelCommand &&
				cmd.label.toLowerCase() === this.label.toLowerCase(),
		);

		if (index > -1) {
			window.context.commandIndex = index;
		}
	}

	public override toString() {
		return `Goto label: ${this.label}`;
	}
}
