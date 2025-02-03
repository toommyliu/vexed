import { Command } from '../command';

export class GotoLabelCommand extends Command {
	public override id = 'misc:goto-label';

	public label!: string;

	public override execute() {}

	public override toString() {
		return `Goto label: ${this.label}`;
	}
}
