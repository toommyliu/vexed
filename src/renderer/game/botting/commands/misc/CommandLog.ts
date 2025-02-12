import { Command } from '../../command';

export class CommandLog extends Command {
	public msg!: string;

	public level!: string;

	public override execute() {
		logger.log(this.level, this.msg);
	}

	public override toString() {
		return `Log message [${this.level}]`;
	}
}
