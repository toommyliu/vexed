// https://github.com/BrenoHenrike/Scripts/blob/Skua/Army/CoreArmyLite.cs

import Config from "@vexed/config";
import log from "electron-log";
import { STORAGE_PATH } from "~/shared/constants";
import { client } from "~/shared/tipc";
import type { Bot } from "./Bot";

const logger = log.scope("game/army");

/**
 * Terminology:
 * Army/group: a group of players working together
 * Leader: player who "dictates" the actions of the group
 * Follower: player who follows the leader's actions
 */
export class Army {
  /**
   * The config file for this group.
   */
  public config!: Config<ArmyConfig>;

  /**
   * The players in this group.
   */
  public players: Set<string> = new Set();

  /**
   * The room number to join.
   */
  public roomNumber!: string;

  /**
   * Whether the army is initialized.
   */
  public isInitialized!: boolean;

  // private isInitialized = false;

  public constructor(public readonly bot: Bot) { }

  /**
   * Sets the config file name.
   *
   * @param fileName - The name of the config file.
   */
  public setConfigName(fileName: string) {
    const cleanFileName = fileName.endsWith(".json")
      ? fileName.slice(0, -5)
      : fileName;

    this.config = new Config({
      configName: cleanFileName,
      cwd: STORAGE_PATH,
    });

    logger.debug(`Using config: ${this.config.configName}`);
  }

  /**
   * Initializes everything needed to begin armying.
   */
  public async init(): Promise<boolean> {
    try {
      await this.config.load();

      const playerCount = this.config.get("PlayerCount");
      if (!playerCount) {
        logger.warn("PlayerCount is not set in config file.");
        return false;
      }

      const roomNumber = this.config.get("RoomNumber");
      if (roomNumber) {
        this.roomNumber = String(roomNumber);
      } else {
        logger.warn("RoomNumber is not set in config file.");
        return false;
      }

      if (playerCount < 1) {
        logger.warn("PlayerCount must be at least 1.");
        return false;
      }

      for (let idx = 1; idx <= playerCount; idx++) {
        const player = this.config.get(`Player${idx}`);
        if (player && typeof player === "string") {
          this.players.add(player);
        } else {
          logger.warn(`Player${idx} not set in config file.`);
        }
      }

      const args = {
        fileName: this.config.configName,
        playerName: this.bot.auth.username,
      };

      if (this.isLeader()) {
        await client.army.init({
          ...args,
          players: Array.from(this.players),
        });
      } else {
        await client.army.join(args);
      }

      this.isInitialized = true;

      const fn = this.onAfk.bind(this);
      this.bot.on("afk", fn);
      window.context.once("end", () => {
        this.bot.off("afk", fn);
      });

      return true;
    } catch (error) {
      logger.error("Army init failed.", error);
      return false;
    }
  }

  /**
   * Whether this player is the leader of the army.
   *
   * @returns True if this player is the leader, false otherwise.
   */
  public isLeader(): boolean {
    const og_player1 = this.config.get("Player1");
    const player_1 = typeof og_player1 === "string" ? og_player1?.trim() : "";

    return (
      Boolean(player_1) &&
      this.bot.auth.username.toLowerCase() === player_1.toLowerCase()
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

  private async onAfk() {
    await this.bot.sleep(1_500);
    this.bot.packets.sendServer("%xt%zm%afk%1%false%");
  }
}

type ArmyConfig = {
  [key: `Player${number}`]: string;
  PlayerCount: number;
  RoomNumber: number;
} & {
  [setName: string]: {
    [key: `Player${number}`]: {
      Armor?: string;
      Cape?: string;
      Class?: string;
      Helm?: string;
      Pet?: string;
      Weapon?: string;
    };
  };
};
