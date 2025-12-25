import log from "electron-log";
import { Bot } from "~/lib/Bot";
import { CancellationError } from "../util/async";
import type { CommandContext } from "./command-context";

export abstract class Command {
  protected readonly bot = Bot.getInstance();

  protected readonly ctx = window.context;

  protected readonly logger = log.scope(`game/${this.constructor.name}`);

  protected _skipDelay = false;

  public get skipDelay(): boolean {
    return this._skipDelay;
  }

  // The implementation of the command
  protected abstract executeImpl(ctx: CommandContext): Promise<void> | void;

  // Template-method pattern to handle cancellation
  public readonly execute = async (ctx: CommandContext): Promise<void> =>
    new Promise((resolve, reject) => {
      const onAbort = () => {
        reject(new CancellationError("Command execution was aborted"));
      };

      ctx.signal.addEventListener("abort", onAbort);

      // eslint-disable-next-line promise/prefer-await-to-then
      Promise.resolve(this.executeImpl(ctx)).then(
        (result) => {
          ctx.signal.removeEventListener("abort", onAbort);
          resolve(result);
        },
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        (error) => {
          ctx.signal.removeEventListener("abort", onAbort);
          reject(error);
        },
      );
    });

  public toString(): string {
    throw new Error("toString() not implemented.");
  }
}
