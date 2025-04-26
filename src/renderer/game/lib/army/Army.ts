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

  /**
   * Whether the army is initialized.
   */
  public isInitialized!: boolean;

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
    // Read the config file
    await this.config.load();

    // Setup the log file sync-ing mechanism
    await this.armyLogging.init();

    const playerCount = this.config.get("PlayerCount");

    if (!playerCount) {
      console.warn("Army: PlayerCount not set in config file.");
      return;
    }

    const playerCountNum = Number.parseInt(playerCount, 10);
    if (Number.isNaN(playerCountNum)) {
      console.warn("Army: PlayerCount is not a number.");
      return;
    }

    for (let index = 1; index <= playerCountNum; index++) {
      const player = this.config.get(`Player${index}`);
      if (player) {
        this.players.add(player);
      } else {
        console.warn(`Army: Player${index} not set in config file.`);
      }
    }

    this.isInitialized = true;
  }

  /**
   * Whether this player is the leader of the army.
   *
   * @returns True if this player is the leader, false otherwise.
   */
  public isLeader(): boolean {
    return (
      this.bot.auth.username.toLowerCase() ===
      this.config.get("Player1")?.toLowerCase()
    );
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

    while (
      !playerList.every((player) => this.bot.world.isPlayerInMap(player))
    ) {
      await this.bot.sleep(1_000);
    }
  }

  /**
   * Gets the player number position in the army.
   */
  public getPlayerNumber(): number {
    const playerList = Array.from(this.players);
    const playerIndex = playerList.indexOf(this.bot.auth.username);

    if (playerIndex === -1) {
      return -1;
    }

    return playerIndex + 1;
  }
}
