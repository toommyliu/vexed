// https://github.com/BrenoHenrike/Scripts/blob/Skua/Army/CoreArmyLite.cs

import { Config } from "../../botting/util/Config";
import type { Bot } from "../Bot";
import { ArmyLogging } from "./ArmyLogging";

// window.Config = Config;

export class Army {
  public armyLogging = new ArmyLogging();

  /**
   * The config file for this army.
   */
  public config!: Config;

  /**
   * The players in this army.
   */
  public players: Set<string> = new Set();

  // private isInitialized = false;

  public constructor(public readonly bot: Bot) {}

  /**
   * Sets the config file name.
   *
   * @param fileName - The name of the config file.
   */
  public setConfigName(fileName: string) {
    const cleanFileName = fileName.endsWith(".txt")
      ? fileName.slice(0, -4)
      : fileName;
    this.config = new Config(cleanFileName);
  }

  /**
   * Sets the log file name.
   *
   * @param fileName - The name of the log file.
   */
  public setLogName(fileName: string) {
    this.armyLogging.setLogName(fileName);
  }

  /**
   * Registers a message to be logged.
   *
   * @param msg - The message to register.
   */
  public registerMessage(msg: string): void {
    this.armyLogging.registerMessage(msg);
  }

  /**
   * Clears the log file.
   */
  public async clearLog(): Promise<void> {
    if (this.isLeader()) {
      await this.armyLogging.clearLog();
    }
  }

  /**
   * Whether the log file is empty.
   *
   * @returns True if the log file is empty, false otherwise.
   */
  public async isEmpty(): Promise<boolean> {
    return this.armyLogging.isEmpty();
  }

  /**
   * Initializes everything needed to begin armying.
   */
  public async init(): Promise<void> {
    // Load the config file
    await this.config.load();

    // Register the players in this army
    const p_1 = this.config.get("Player1");
    const p_2 = this.config.get("Player2");
    const p_3 = this.config.get("Player3");
    const p_4 = this.config.get("Player4");
    if (p_1) this.players.add(p_1);
    if (p_2) this.players.add(p_2);
    if (p_3) this.players.add(p_3);
    if (p_4) this.players.add(p_4);

    // this.isInitialized = true;
  }

  /**
   * Whether this player is the leader of the army.
   *
   * @returns True if this player is the leader, false otherwise.
   */
  public isLeader(): boolean {
    const p_1 = this.config.get("Player1");
    if (p_1) {
      return this.bot.auth.username.toLowerCase() === p_1.toLowerCase();
    }

    return false;
  }

  /**
   * Writes to the log file that this player is done with a task.
   *
   * @returns True if the message was sent, false if it was already in the log.
   */
  public async sendDone(): Promise<boolean> {
    try {
      const alreadyInLog = await this.armyLogging.isAlreadyInLog(this.players);
      if (!alreadyInLog) {
        this.armyLogging.registerMessage(
          `${this.bot.auth.username}:done:${this.armyLogging.message}`,
        );
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  /**
   * Whether all players in the army are done with the task.
   *
   * @returns True if all players are done, false otherwise.
   */
  public async isAllDone() {
    return this.armyLogging.isAlreadyInLog(this.players);
  }

  /**
   * Waits for all players in the army in the map.
   */
  public async waitForAll() {
    const playerList = Array.from(this.players);
    let allInMap = true;

    await this.bot.waitUntil(() => {
      allInMap = true;
      for (const player of playerList) {
        if (!this.bot.world.isPlayerInMap(player)) {
          allInMap = false;
          break;
        }
      }

      return allInMap;
    });
  }
}
