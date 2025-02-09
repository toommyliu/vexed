import { Command } from '../command';

export class CommandLabel extends Command {
	public label!: string;

	public override execute() {}

	public override toString() {
		return `Label: ${this.label}`;
	}
}
