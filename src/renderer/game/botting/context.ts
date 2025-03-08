import { AsyncQueue } from '@sapphire/async-queue';
import { EventEmitter } from 'tseep';
import { interval } from '../../../common/interval';
import { Logger } from '../../../common/logger';
import { Bot } from '../lib/Bot';
import type { Command } from './command';

const logger = Logger.get('Context');

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

  private readonly _handlers: Map<string, (packet: string) => void>;

  private _commands: Command[];

  private commandDelay: number;

  private _commandIndex: number;

  private _on: boolean;

  public constructor() {
    super();

    this.questIds = new Set();
    this.itemIds = new Set();
    // this.boostIds = new Set();

    this._handlers = new Map();

    this.queue = new AsyncQueue();
    this._commands = [];
    this.commandDelay = 1_000;
    this._commandIndex = 0;

    this._on = false;

    this._runHandlers();
  }

  public registerHandler(name: string, handler: (packet: string) => void) {
    this._handlers.set(name, handler);
  }

  public unregisterHandler(name: string) {
    this._handlers.delete(name);
  }

  private _runHandlers() {
    this.bot.on('packetFromServer', (packet) => {
      if (!this.isRunning()) return;

      if (packet.startsWith('{')) {
        // run all handlers
        try {
          for (const [, handler] of this._handlers) {
            handler.call(
              {
                bot: this.bot,
              },
              JSON.parse(packet),
            );
          }
        } catch {}
      }
    });
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

  public setCommands(commands: Command[]) {
    this._commands = commands;
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
    return this._on;
  }

  public async start() {
    this._on = true;

    await this.startContextTimers();
    await this.startCommandExecution();
  }

  public async stop() {
    // logger.info('context stopping');
    this._stop();
  }

    void interval(async (_, stop) => {
      if (!this.isRunning()) {
        stop();
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

    void interval(async (_, stop) => {
      if (!this.isRunning()) {
        stop();
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
    if (this.isCommandQueueEmpty()) return;

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
    this._on = false;
    this.queue.abortAll();
    // this._commands = [];
    // this._commandIndex = 0;
  }
}

type Events = {
  end(): void;
};
