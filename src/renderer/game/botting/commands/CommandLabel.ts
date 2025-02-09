import { Command } from '../command';

export class CommandLabel extends Command {
	public override id = 'misc:label';

	public label!: string;

	public override execute() {}

	public override toString() {
		return `Label: ${this.label}`;
	}
}
