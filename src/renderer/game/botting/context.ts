import { TypedEmitter } from 'tiny-typed-emitter';
import { interval } from '../../../common/interval';
import { Logger } from '../../../common/logger';
import { Bot } from '../lib/Bot';
import { BoostType } from '../lib/Player';
import type { Command } from './command';
import { CommandOverlay } from './overlay';

const logger = Logger.get('Context');

export class Context extends TypedEmitter<Events> {
  private readonly bot = Bot.getInstance();

  /**
   * List of quest ids to watch for.
   */
  private readonly questIds: Set<number>;

  /**
   * List of item ids to watch for.
   */
  private readonly items: Set<string>;

  /**
   * List of boost to watch and use.
   */
  private readonly boosts: Set<string>;

  /*
   * Packet event handlers.
   */
  private readonly _handlers: Map<
    string,
    (packet: Record<string, unknown>) => Promise<void> | void
  >;

  private _commands: Command[];

  private _commandDelay: number;

  private _commandIndex: number;

  private _on: boolean;

  public readonly overlay: CommandOverlay;

  public constructor() {
    super();

    this.questIds = new Set();
    this.items = new Set();
    this.boosts = new Set();

    this._handlers = new Map();

    this._commands = [];
    this._commandDelay = 1_000;
    this._commandIndex = 0;

    this._on = false;

    this._runHandlers();

    this.overlay = new CommandOverlay();
  }

  /**
   * Registers a packet event handler.
   *
   * @param name - The name of the handler
   * @param handler - The handler function
   */
  public registerHandler(
    name: string,
    handler: (packet: Record<string, unknown>) => void,
  ) {
    this._handlers.set(name, handler);
  }

  /**
   * Unregisters a packet event handler.
   *
   * @param name - The name of the handler
   */
  public unregisterHandler(name: string) {
    this._handlers.delete(name);
  }

  private _runHandlers() {
    this.bot.on('pext', async (packet) => {
      if (!this.isRunning()) return;

      // run all handlers
      try {
        for (const [, handler] of this._handlers) {
          await handler.call(
            {
              bot: this.bot,
            },
            packet,
          );
        }
      } catch {}
    });
  }

  /**
   * Getter for the current command index.
   */
  public get commandIndex() {
    return this._commandIndex;
  }

  /**
   * Setter for the current command index.
   */
  public set commandIndex(index: number) {
    this._commandIndex = index;
  }

  /**
   * The list of commands to execute.
   */
  public get commands() {
    return this._commands;
  }

  /**
   * Get the command at the given index.
   *
   * @param index - The index of the command.
   * @returns The command at the given index.
   */
  public getCommand(index: number) {
    return this._commands[index];
  }

  /**
   * Adds a command to the queue.
   *
   * @param command - The command to add.
   */
  public addCommand(command: Command) {
    this._commands.push(command);
  }

  /**
   * Sets the list of commands to execute.
   *
   * @param commands - The list of commands to set.
   */
  public setCommands(commands: Command[]) {
    this._commands = commands;
  }

  /**
   * Whether the command queue is empty.
   */
  public isCommandQueueEmpty() {
    return this._commands.length === 0;
  }

  /**
   * Sets the delay between commands.
   *
   * @param delay - The delay between commands.
   */
  public setCommandDelay(delay: number) {
    this._commandDelay = delay;
  }

  /**
   * Starts automated quest management for the given quest id.
   *
   * @param questId - The quest id
   */
  public registerQuest(questId: number) {
    this.questIds.add(questId);
  }

  /**
   * Stops automated quest management for the given quest id.
   *
   * @param questId - The quest id
   */
  public unregisterQuest(questId: number) {
    this.questIds.delete(questId);
  }

  /**
   * Starts automated pickup for an item.
   *
   * @param item - The item name
   */
  public registerDrop(item: string) {
    this.items.add(item);
  }

  /**
   * Stops automated pickup for an item.
   *
   * @param item - The item name
   */
  public unregisterDrop(item: string) {
    this.items.delete(item);
  }

  /**
   * @param name - The item name of the boost.
   * @remarks
   */
  public registerBoost(name: string) {
    this.boosts.add(name);
  }

  /**
   * @param name - The item name of the boost.
   */
  public unregisterBoost(name: string) {
    this.boosts.delete(name);
  }

  public isRunning() {
    return this._on;
  }

  public async start() {
    this._on = true;
    this.overlay.show();

    await this.prepare();

    this.emit('start');

    await Promise.all([this.runTimers(), this.runCommands()]);
  }

  public async stop() {
    // logger.info('context stopping');
    this._stop();
  }

  private async prepare() {
    // unbank all items
    await this.bot.bank.withdrawMultiple(Array.from(this.items));
    await this.bot.bank.withdrawMultiple(Array.from(this.boosts));
  }

  private async runTimers() {
    // TODO: use utilty helper

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

      for (const item of Array.from(this.items)) {
        try {
          if (this.bot.drops.hasDrop(item)) await this.bot.drops.pickup(item);
        } catch {}
      }
    }, 1_000);

    void interval(async (_, stop) => {
      if (!this.isRunning()) {
        stop();
        return;
      }

      for (const boost of Array.from(this.boosts)) {
        try {
          if (this.bot.inventory.contains(boost)) {
            const _boost = boost.toLowerCase();
            const variant = _boost.includes('gold')
              ? BoostType.Gold
              : _boost.includes('xp')
                ? BoostType.Exp
                : _boost.includes('rep')
                  ? BoostType.Rep
                  : _boost.includes('class')
                    ? BoostType.ClassPoints
                    : null;

            if (!variant) continue;

            // we don't have this boost type active, use it
            if (!this.bot.player.isBoostActive(variant)) {
              const item = this.bot.inventory.get(boost);
              if (!item) continue;

              this.bot.flash.call(() => swf.playerUseBoost(item.id));
            }
          }
        } catch {}
      }
    }, 1_000);
  }

  private async runCommands() {
    if (this.isCommandQueueEmpty()) {
      this._stop();
      return;
    }

    this._commandIndex = 0;

    if (!this.bot.player.isLoaded()) {
      logger.info('waiting for load');
      await this.bot.waitUntil(() => this.bot.player.isLoaded(), null, -1);
      logger.info('player loaded');
    }

    while (this._commandIndex < this._commands.length && this.isRunning()) {
      if (!this.isRunning()) break;

      try {
        const command = this.getCommand(this.commandIndex);
        if (!command) {
          break;
        }

        this.overlay.updateCommands(this._commands, this._commandIndex);
        // logger.info(
        //   `${command.toString()} [${this._commandIndex + 1}/${this._commands.length}]`,
        // );

        const result = command.execute();
        if (result instanceof Promise) {
          await result;
        }

        if (!this.isRunning()) break;

        await this.bot.sleep(this._commandDelay);

        if (!this.isRunning()) break;

        if (this.isRunning()) this._commandIndex++;
      } catch (error) {
        logger.error('Error executing a command', error);
      }
    }

    this._stop();
    // logger.info('command execution finished');
  }

  // TODO: add an option to restart if end is reached

  private _stop() {
    this.overlay.hide();
    this.emit('end');
    this._on = false;
  }
}

type Events = {
  end(): void;
  start(): void;
};
