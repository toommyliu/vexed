import { Command } from '../command';

export class LogCommand extends Command {
	public override id = 'misc:log';

	public msg!: string;

	public level!: string;

	public override execute() {
		logger.log(this.level, this.msg);
	}
}
