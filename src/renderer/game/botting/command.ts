import { Bot } from '../lib/Bot';

export class Command {
  protected readonly bot = Bot.getInstance();

  protected readonly ctx = window.context;

  public execute(): Promise<void> | void {
    throw new Error('execute() not implemented.');
  }

  public toString(): string {
    throw new Error('toString() not implemented.');
  }
}
