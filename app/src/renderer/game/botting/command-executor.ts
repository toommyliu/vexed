import { Mutex } from "async-mutex";
import log from "electron-log";
import { TypedEmitter } from "tiny-typed-emitter";
import { Bot } from "~/lib/Bot";
import { commandOverlayState } from "../state.svelte";
import { CancellationError } from "../util/async";
import type { Command } from "./command";
import { CommandRegisterDrop } from "./commands/item/CommandRegisterDrop";
import { CommandAcceptQuest } from "./commands/quest/CommandAcceptQuest";
import { CommandRegisterQuest } from "./commands/quest/CommandRegisterQuest";

const logger = log.scope("game/CommandExecutor");

export class CommandExecutor extends TypedEmitter<Events> {
  private readonly bot = Bot.getInstance();

  private readonly mutex = new Mutex();

  public static _instance: CommandExecutor | null = null;

  /**
   * "pext" handlers.
   */
  private readonly _pextHandlers: Map<
    string,
    (packet: Record<string, unknown>) => Promise<void> | void
  > = new Map();

  /**
   * "packetFromServer" handlers.
   * Server packets can be XML or JSON strings that need parsing
   */
  private readonly _packetFromServerHandlers: Map<
    string,
    (packet: string) => Promise<void> | void
  > = new Map();

  /**
   * "packetFromClient" handlers.
   * Client packets are XT packet strings
   */
  private readonly _packetFromClientHandlers: Map<
    string,
    (packet: string) => Promise<void> | void
  > = new Map();

  private readonly _tasks = new Map<string, () => Promise<void>>();

  private _commands: Command[];

  private _commandDelay: number;

  private _commandIndex: number;

  private _ac: AbortController;

  /**
   * Captured commands when in capture mode.
   */
  private _capturedCommands: Command[] = [];

  /**
   * Whether the context is in capture mode. When in capture mode, commands don't get
   * added to the command queue, rather they are captured for later execution (for conditions).
   */
  private _captureMode = false;

  public constructor() {
    super();

    this._pextHandlers = new Map();
    this._packetFromServerHandlers = new Map();
    this._packetFromClientHandlers = new Map();
    this._runHandlers();

    this._commands = [];
    this._commandDelay = 1_000;
    this._commandIndex = 0;
    this._capturedCommands = [];
    this._captureMode = false;

    this._ac = new AbortController();
    this._ac.abort();

    this.bot.on("logout", () => this._onLogout());
  }

  /**
   * Registers a packet event handler.
   *
   * @param type - The type of handler to register
   * @param name - The name of the handler
   * @param handler - The handler function
   */
  public registerHandler(
    type: "pext",
    name: string,
    handler: (packet: Record<string, unknown>) => Promise<void> | void,
  ): void;
  public registerHandler(
    type: "packetFromClient" | "packetFromServer",
    name: string,
    handler: (packet: string) => Promise<void> | void,
  ): void;
  public registerHandler(
    type: "packetFromClient" | "packetFromServer" | "pext",
    name: string,
    handler:
      | ((packet: Record<string, unknown>) => Promise<void> | void)
      | ((packet: string) => Promise<void> | void),
  ) {
    switch (type) {
      case "pext":
        this._pextHandlers.set(
          name,
          handler as (packet: Record<string, unknown>) => Promise<void> | void,
        );
        break;
      case "packetFromServer":
        this._packetFromServerHandlers.set(
          name,
          handler as (packet: string) => Promise<void> | void,
        );
        break;
      case "packetFromClient":
        this._packetFromClientHandlers.set(
          name,
          handler as (packet: string) => Promise<void> | void,
        );
        break;
      default:
    }
  }

  /**
   * Unregisters a packet event handler.
   *
   * @param type - The type of handler to unregister
   * @param name - The name of the handler
   */
  public unregisterHandler(
    type: "packetFromClient" | "packetFromServer" | "pext",
    name: string,
  ) {
    switch (type) {
      case "pext":
        this._pextHandlers.delete(name);
        break;
      case "packetFromServer":
        this._packetFromServerHandlers.delete(name);
        break;
      case "packetFromClient":
        this._packetFromClientHandlers.delete(name);
        break;
      default:
    }
  }

  private _runHandlers() {
    this.bot.on("pext", async (packet: Record<string, unknown>) => {
      if (!this.isRunning()) return;

      try {
        for (const [, handler] of this._pextHandlers) {
          if (!this.isRunning()) break;

          await handler.call(
            {
              bot: this.bot,
            },
            packet,
          );
        }
      } catch {}
    });

    this.bot.on("packetFromServer", async (packet: string) => {
      if (!this.isRunning()) return;

      try {
        for (const [, handler] of this._packetFromServerHandlers) {
          if (!this.isRunning()) break;

          await handler.call(
            {
              bot: this.bot,
            },
            packet,
          );
        }
      } catch {}
    });

    this.bot.on("packetFromClient", async (packet: string) => {
      if (!this.isRunning()) return;

      try {
        for (const [, handler] of this._packetFromClientHandlers) {
          if (!this.isRunning()) break;

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
   * Registers a task to be run.
   *
   * @param name - The name of the task
   * @param task - The task function
   */
  public registerTask(name: string, task: () => Promise<void>) {
    this._tasks.set(name, task);
  }

  /**
   * Unregisters a task.
   *
   * @param name - The name of the task
   */
  public unregisterTask(name: string) {
    this._tasks.delete(name);
  }

  /**
   * Checks if a task is registered.
   *
   * @param name - The name of the task
   * @returns True if the task is registered, false otherwise
   */
  public hasTask(name: string) {
    return this._tasks.has(name);
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
    if (this._captureMode) {
      this._capturedCommands.push(command);
    } else {
      this._commands.push(command);
    }
  }

  /**
   * Starts command capture mode and returns captured commands when exited.
   *
   * @param cmdFactory - Function that will add commands to be captured
   * @returns Array of commands that were captured
   */
  public captureCommands(cmdFactory: () => void): Command[] {
    const ogCaptureMode = this._captureMode;
    const ogCapturedCommands = this._capturedCommands;

    this._captureMode = true;
    this._capturedCommands = [];

    try {
      cmdFactory(); // invoke the factory fn, which should add the captured command
      return [...this._capturedCommands]; // the captured command
    } finally {
      this._captureMode = ogCaptureMode;
      this._capturedCommands = ogCapturedCommands;
    }
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

  public isRunning() {
    return !this._ac.signal.aborted;
  }

  public async start() {
    const release = await this.mutex.acquire();

    try {
      if (this.isRunning()) return;

      await this.bot.waitUntil(() => this.bot.player.isReady(), {
        indefinite: true,
      });

      this._ac = new AbortController();
    } finally {
      release();
    }

    if (!this.isRunning()) return;

    try {
      await this.doPreInit();

      if (!this.isRunning()) return;

      commandOverlayState.show();
      await this.runCommands();
    } catch (error) {
      if (this.isRunning()) this._stop();
      throw error;
    }
  }

  public async stop() {
    await this.mutex.runExclusive(async () => {
      if (!this.isRunning()) return;

      this._stop();

      await this.bot.waitUntil(
        () => this.bot.player.isReady() && this.bot.player.alive,
      );

      if (!this.bot.player.isReady() && !this.bot.player.alive) return;

      await this.bot.combat.exit();
    });
  }

  public static getInstance() {
    this._instance ??= new CommandExecutor();
    return this._instance;
  }

  private async doPreInit() {
    if (!this.bot.player.isReady())
      await this.bot.waitUntil(() => this.bot.player.isReady());

    const questList = this._commands
      .filter(
        (cmd) =>
          cmd instanceof CommandRegisterQuest ||
          cmd instanceof CommandAcceptQuest,
      )
      .flatMap((cmd) => {
        if (cmd instanceof CommandRegisterQuest) {
          return cmd.quests.map((quest) => quest.questId);
        }

        if (cmd instanceof CommandAcceptQuest) {
          return [cmd.questId];
        }

        return [];
      });

    if (questList.length) {
      logger.debug("Quest list", questList);
    }

    const unbankList = this._commands
      .filter((command) => command instanceof CommandRegisterDrop)
      .flatMap((cmd) => cmd.item);

    if (unbankList.length) {
      logger.debug("Unbank list", unbankList);
    }

    await this.bot.quests.loadMultiple(questList);

    const toWithdraw = [
      ...unbankList,
      ...Array.from(this.bot.environment.boosts),
    ];

    if (toWithdraw.length > 0) {
      await this.bot.bank.open(true, true);
      await this.bot.bank.withdrawMultiple(toWithdraw);
    }

    this.emit("start");
  }

  private async runCommands() {
    if (this.isCommandQueueEmpty()) {
      this._stop();
      return;
    }

    this._commandIndex = 0;

    if (!this.bot.player.isReady())
      await this.bot.waitUntil(() => this.bot.player.isReady());

    this.bot.currentSignal = this._ac.signal;

    while (this._commandIndex < this._commands.length && this.isRunning()) {
      try {
        const command = this.getCommand(this._commandIndex);
        if (!command) break;

        commandOverlayState.updateCommands(this._commands, this._commandIndex);

        const abortPromise = new Promise<void>((_resolve, reject) => {
          this._ac.signal.addEventListener("abort", () => {
            reject(new CancellationError());
          });
        });

        await Promise.race([command.execute(this._ac.signal), abortPromise]);

        if (!this.isRunning()) break;

        await this.bot.sleep(
          /* need slight delay otherwise some commands get 'executed too fast' */
          this._commandDelay === 0 || command?.skipDelay
            ? 50
            : this._commandDelay,
          this._ac.signal,
        );
        if (!this.isRunning()) break;

        this._commandIndex++;
      } catch (error) {
        if (
          !error ||
          this._ac.signal.aborted ||
          error instanceof CancellationError
        )
          break;

        logger.error(
          `Error executing command at index ${this._commandIndex}. ${error}`,
        );

        if (!this.isRunning()) break;
        this._commandIndex++;
      }
    }

    this._stop();
  }

  private _stop() {
    if (!this._ac.signal.aborted) {
      this.emit("end");
      this._ac.abort();
    }

    this.bot.currentSignal = undefined;

    commandOverlayState.hide();
  }

  private _onLogout() {
    // TODO: better strategy for:
    /*
    cmd.logout()
    cmd.close_window() // doesn't work
    */

    if (this.isRunning()) this._stop();
  }
}

type Events = {
  end(): void;
  start(): void;
};
