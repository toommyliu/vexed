import { AsyncQueue } from '@sapphire/async-queue';
import { EventEmitter } from 'tseep';
import { Bot } from '../lib/Bot';
import type { SetIntervalAsyncTimer } from '../lib/util/TimerManager';
import type { Command } from './command';

export class Context extends EventEmitter<Events> {
  private readonly bot = Bot.getInstance();

  private readonly queue: AsyncQueue;

  /**
   * List of quest ids to watch for.
   */
  private readonly questIds: Set<number>;

  /**
   * List of item ids to watch for.
   */
  private readonly itemIds: Set<number>;

  /**
   * List of boost ids to watch for.
   */
  // private readonly boostIds: Set<number>;

  private questTimer!: SetIntervalAsyncTimer;

  private itemTimer!: SetIntervalAsyncTimer;

  // private boostTimer!: SetIntervalAsyncTimer;

  private readonly _commands: Command[];

  private commandDelay: number;

  private _commandIndex: number;

  private abortController: AbortController | null = null;

  public constructor(options: { commandDelay?: number } = {}) {
    super();

    this.questIds = new Set();
    this.itemIds = new Set();
    // this.boostIds = new Set();

    this.queue = new AsyncQueue();
    this._commands = [];
    this.commandDelay = options.commandDelay ?? 1_000;
    this._commandIndex = 0;
  }

  public get commandIndex() {
    return this._commandIndex;
  }

  public set commandIndex(index: number) {
    this._commandIndex = index;
  }

  public get commands() {
    return this._commands;
  }

  public getCommand(index: number) {
    return this._commands[index];
  }

  public setCommandDelay(delay: number) {
    this.commandDelay = delay;
  }

  public addCommand(command: Command) {
    this._commands.push(command);
  }

  public isCommandQueueEmpty() {
    return this._commands.length === 0;
  }

  /**
   * Starts automated quest management for the given quest id.
   *
   * @param questId - The quest id
   */
  public addQuest(questId: number) {
    this.questIds.add(questId);
  }

  /**
   * Stops automated quest management for the given quest id.
   *
   * @param questId - The quest id
   */
  public removeQuest(questId: number) {
    this.questIds.delete(questId);
  }

  /**
   * Starts automated item pickup for the given item id.
   *
   * @param itemId - The item id
   */
  public addItem(itemId: number) {
    this.itemIds.add(itemId);
  }

  /**
   * Stops automated item pickup for the given item id.
   *
   * @param itemId - The item id
   */
  public removeItem(itemId: number) {
    this.itemIds.delete(itemId);
  }

  public isRunning() {
    return Boolean(
      this.abortController && !this.abortController.signal.aborted,
    );
  }

  public async start() {
    this.abortController = new AbortController();

    await this.startContextTimers();

    if (!this.isCommandQueueEmpty) {
      await this.startCommandExecution();
    }
  }

  public async stop() {
    // logger.info('context stopping');
    this._stop();
  }

  private async startContextTimers() {
    this.questTimer = this.bot.timerManager.setInterval(async () => {
      if (!this.isRunning()) {
        void this.bot.timerManager.clearInterval(this.questTimer);
        return;
      }

      for (const questId of Array.from(this.questIds)) {
        try {
          if (!swf.questsIsInProgress(questId)) {
            swf.questsAccept(questId);
          }

          if (swf.questsCanCompleteQuest(questId)) {
            void this.bot.quests.complete(questId);
            void this.bot.quests.accept(questId);
          }
        } catch {}
      }
    }, 1_000);

    this.itemTimer = this.bot.timerManager.setInterval(async () => {
      if (!this.isRunning()) {
        void this.bot.timerManager.clearInterval(this.itemTimer);
        return;
      }

      for (const itemId of Array.from(this.itemIds)) {
        try {
          if (this.bot.drops.hasDrop(itemId))
            await this.bot.drops.pickup(itemId);
        } catch {}
      }
    }, 1_000);
  }

  private async startCommandExecution() {
    this._commandIndex = 0;

    if (!this.bot.player.isLoaded()) {
      logger.info('waiting for load');
      await this.bot.waitUntil(() => this.bot.player.isLoaded(), null, -1);
      logger.info('player loaded');
    }

    while (this._commandIndex < this._commands.length && this.isRunning()) {
      if (!this.isRunning()) break;

      await this.queue.wait();

      if (!this.isRunning()) break;

      try {
        const command = this.getCommand(this.commandIndex);
        if (!command) {
          break;
        }

        logger.info(
          `${command.toString()} [${this._commandIndex + 1}/${this._commands.length}]`,
        );

        const result = command.execute();
        if (result instanceof Promise) {
          await result;
        }

        if (!this.isRunning()) break;

        await this.bot.sleep(this.commandDelay);

        if (!this.isRunning()) break;
      } finally {
        this.queue.shift();
      }

      if (this.isRunning()) this._commandIndex++;
    }

    this.emit('end');
    this._stop();
    // logger.info('command execution finished');
  }

  // TODO: add an option to restart if end is reached
  // TODO: add drops, quests, boosts runtime

  private _stop() {
    this.queue.abortAll();
    // this._commands = [];
    // this._commandIndex = 0;
    this.abortController?.abort();
    this.abortController = null;
  }
}

type Events = {
  end(): void;
};
