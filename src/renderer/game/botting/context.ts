import { TypedEmitter } from "tiny-typed-emitter";
import { interval } from "../../../common/interval";
import { Logger } from "../../../common/logger";
import { Bot } from "../lib/Bot";
import { BoostType } from "../lib/Player";
import {
  registerDrop,
  startDropsTimer,
  stopDropsTimer,
  unregisterDrop,
} from "../util/dropTimer";
import {
  startQuestTimer,
  stopQuestTimer,
  registerQuest,
  unregisterQuest,
} from "../util/questTimer";
import type { Command } from "./command";
import { CommandRegisterDrop } from "./commands/item/CommandRegisterDrop";
import { CommandAcceptQuest } from "./commands/quest/CommandAcceptQuest";
import { CommandRegisterQuest } from "./commands/quest/CommandRegisterQuest";
import { CommandOverlay } from "./overlay";

const logger = Logger.get("Context");

export class Context extends TypedEmitter<Events> {
  private readonly bot = Bot.getInstance();

  public static _instance: Context | null = null;

  /**
   * List of boost to watch and use.
   */
  private readonly boosts: Set<string>;

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

  private _commands: Command[];

  private _commandDelay: number;

  private _commandIndex: number;

  private _on: boolean;

  public readonly overlay: CommandOverlay;

  public constructor() {
    super();

    this.boosts = new Set();

    this._pextHandlers = new Map();
    this._packetFromServerHandlers = new Map();
    this._packetFromClientHandlers = new Map();
    this._runHandlers();

    this._commands = [];
    this._commandDelay = 1_000;
    this._commandIndex = 0;

    this._on = false;

    this.overlay = new CommandOverlay();
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
    registerQuest(questId?.toString());
  }

  /**
   * Stops automated quest management for the given quest id.
   *
   * @param questId - The quest id
   */
  public unregisterQuest(questId: number) {
    unregisterQuest(questId?.toString());
  }

  /**
   * Starts automated pickup for an item.
   *
   * @param item - The item name
   * @param rejectElse - Whether to reject all other items
   */
  public registerDrop(item: string, rejectElse?: boolean) {
    registerDrop(item, rejectElse);
  }

  /**
   * Stops automated pickup for an item.
   *
   * @param item - The item name
   */
  public unregisterDrop(item: string) {
    unregisterDrop(item);
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

    await this.doPreInit();
    await Promise.all([this.runTimers(), this.runCommands()]);
  }

  public async stop() {
    // logger.info('context stopping');
    this._stop();
  }

  public static getInstance() {
    this._instance ??= new Context();
    return this._instance;
  }

  private async doPreInit() {
    if (!this.bot.player.isReady()) {
      logger.info("waiting for load (1)");
      await this.bot.waitUntil(() => this.bot.player.isLoaded(), null, -1);
      logger.info("player loaded (2)");
    }

    const questList = this._commands
      .filter(
        (cmd) =>
          cmd instanceof CommandRegisterQuest ||
          cmd instanceof CommandAcceptQuest,
      )
      .flatMap((cmd) => {
        if (cmd instanceof CommandRegisterQuest) {
          return cmd.questIds.flatMap(String);
        }

        if (cmd instanceof CommandAcceptQuest) {
          return [String(cmd.questId)];
        }

        return [];
      });

    const unbankList = this._commands
      .filter((command) => command instanceof CommandRegisterDrop)
      .flatMap((cmd) => cmd.item);

    console.log("Quest list", questList);
    console.log("Unbank list", unbankList);

    await this.bot.quests.loadMultiple(questList);
    await this.bot.bank.withdrawMultiple(unbankList);
    await this.bot.bank.withdrawMultiple(Array.from(this.boosts));

    this.emit("start");
  }

  private async runTimers() {
    startDropsTimer();
    startQuestTimer();

    void interval(async (_, stop) => {
      if (!this.isRunning()) {
        stop();
        return;
      }

      for (const boost of Array.from(this.boosts)) {
        try {
          if (this.bot.inventory.contains(boost)) {
            const _boost = boost.toLowerCase();
            const variant = _boost.includes("gold")
              ? BoostType.Gold
              : _boost.includes("xp")
                ? BoostType.Exp
                : _boost.includes("rep")
                  ? BoostType.Rep
                  : _boost.includes("class")
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

    if (!this.bot.player.isReady()) {
      logger.info("waiting for load");
      await this.bot.waitUntil(() => this.bot.player.isLoaded(), null, -1);
      logger.info("player loaded");
    }

    while (this._commandIndex < this._commands.length && this.isRunning()) {
      if (!this.isRunning()) break;

      try {
        const command = this.getCommand(this.commandIndex);
        if (!command) {
          break;
        }

        this.overlay.updateCommands(this._commands, this._commandIndex);

        const result = command.execute();
        if (result instanceof Promise) {
          await result;
        }

        if (!this.isRunning()) break;

        if (!command.skipDelay) {
          await this.bot.sleep(this._commandDelay);
        }

        if (!this.isRunning()) break;

        if (this.isRunning()) this._commandIndex++;
      } catch (error) {
        logger.error("Error executing a command", error);
      }
    }

    this._stop();
    // logger.info('command execution finished');
  }

  // TODO: add an option to restart if end is reached

  private _stop() {
    stopDropsTimer();
    stopQuestTimer();

    this.overlay.hide();
    this.emit("end");
    this._on = false;
  }
}

type Events = {
  end(): void;
  start(): void;
};
