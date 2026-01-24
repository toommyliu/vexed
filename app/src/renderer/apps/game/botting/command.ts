import log from "electron-log";
import { Bot } from "../lib/Bot";
import { CancellationError } from "../util/async";

export abstract class Command {
  protected readonly bot = Bot.getInstance();

  protected readonly ctx = window.context;

  protected readonly logger = log.scope(`game/${this.constructor.name}`);

  protected _skipDelay = false;

  public get skipDelay(): boolean {
    return this._skipDelay;
  }

  // The implementation of the command
  protected abstract executeImpl(signal: AbortSignal): Promise<void> | void;

  // Template-method pattern to handle cancellation
  public readonly execute = async (signal: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
      const onAbort = () => {
        reject(new CancellationError("Command execution was aborted"));
      };

      signal.addEventListener("abort", onAbort);

      // eslint-disable-next-line promise/prefer-await-to-then
      Promise.resolve(this.executeImpl(signal)).then(
        (result) => {
          signal.removeEventListener("abort", onAbort);
          resolve(result);
        },
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        (error) => {
          signal.removeEventListener("abort", onAbort);
          reject(error);
        },
      );
    });

  public toString(): string {
    throw new Error("toString() not implemented.");
  }
}
