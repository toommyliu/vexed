import { Bot } from '../lib/Bot';

export class Command {
	protected readonly bot = Bot.getInstance();

	public execute(): Promise<void> | void {
		throw new Error('execute() not implemented.');
	}

	public toString(): string {
		throw new Error('toString() not implemented.');
	}
}
