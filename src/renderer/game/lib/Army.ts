// https://github.com/BrenoHenrike/Scripts/blob/Skua/Army/CoreArmyLite.cs

import { client } from "../../../shared/tipc";
import { Config } from "../botting/util/Config";
import type { Bot } from "./Bot";

/**
 * Terminology:
 * Army/group: a group of players working together
 * Leader: player who "dictates" the actions of the group
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
  public async init(): Promise<boolean> {
    // Load the config
    try {
      await this.config.load();

      console.log("Army: Config loaded", this.config.getAll());

      const playerCount = this.config.get("PlayerCount");
      if (!playerCount) {
        console.warn("Army: PlayerCount not set in config file.");
        return false;
      }

      const roomNumber = this.config.get("RoomNumber");
      if (roomNumber) {
        this.roomNumber = String(roomNumber);
      } else {
        console.warn("Army: RoomNumber not set in config file.");
        return false;
      }

      // const playerCountNum = Number.parseInt(playerCount, 10);
      // if (Number.isNaN(playerCountNum)) {
      //   onsole.warn("Army: PlayerCount is not a number.");
      //   return;
      // }

      if (playerCount < 1) {
        console.warn("Army: PlayerCount must be at least 1.");
        return false;
      }

      for (let index = 1; index <= playerCount; index++) {
        const player = this.config.get(`Player${index}`);
        if (player && typeof player === "string") {
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
        // Init army for everyone else
        console.log("Army: Leader");
        await client.armyInit({
          ...args,
          players: Array.from(this.players),
        });
      } else {
        // Join the army
        await client.armyJoin(args);
      }

      this.isInitialized = true;

      const fn = this.onAfk.bind(this);
      this.bot.on("afk", fn);
      window.context.once("end", () => {
        this.bot.off("afk", fn);
      });

      return true;
    } catch {
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
    // console.log("Army: Anti-AFK triggered");
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
