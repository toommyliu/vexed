// https://github.com/BrenoHenrike/Scripts/blob/Skua/Army/CoreArmyLite.cs

import { ipcRenderer } from "../../../../common/ipc";
import { IPC_EVENTS } from "../../../../common/ipc-events";
import { Config } from "../../botting/util/Config";
import type { Bot } from "../Bot";

export class Army {
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
   * Initializes everything needed to begin armying.
   */
  public async init(): Promise<void> {
    await this.config.load();

    console.log("Army: Config loaded", this.config.getAll());

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

    const args = {
      fileName: this.config.fileName,
      playerName: this.bot.auth.username,
    };

    if (this.isLeader()) {
      console.log("Army: Leader");
      await ipcRenderer.callMain(IPC_EVENTS.ARMY_INIT, {
        ...args,
        players: Array.from(this.players),
      });
    } else {
      console.log("Army: Follower");
      await ipcRenderer.callMain(IPC_EVENTS.ARMY_JOIN, args);
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
