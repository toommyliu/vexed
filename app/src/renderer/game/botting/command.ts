import log from "electron-log";
import { Bot } from "@lib/Bot";

export class Command {
  protected readonly bot = Bot.getInstance();

  protected readonly ctx = window.context;

  protected readonly logger = log.scope(`game/${this.constructor.name}`);

  public skipDelay = false;

  public execute(): Promise<void> | void {
    throw new Error("execute() not implemented.");
  }

  public toString(): string {
    throw new Error("toString() not implemented.");
  }
}
