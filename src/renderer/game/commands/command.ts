import { Bot } from '../api/Bot';

export class Command {
	protected readonly bot = Bot.getInstance();

	public id!: string;

	public execute(..._args: unknown[]): Promise<void> | void {
		throw new Error('Method not implemented.');
	}
	public toString(): string {
		return this.id ?? '';
	}
}
