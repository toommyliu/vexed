// https://github.com/BrenoHenrike/Scripts/blob/Skua/Army/CoreArmyLite.cs

import { Result } from "better-result";
import log from "~/renderer/shared/logger";
import type { ArmyConfigPayload, ArmyConfigRaw } from "~/shared/army/types";
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
   * The normalized config file name for this group.
   */
  public configName = "";

  /**
   * The raw config payload loaded from main process.
   */
  public rawConfig: ArmyConfigRaw = {};

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

  private leader = "";

  public constructor(public readonly bot: Bot) {}

  /**
   * Sets the config file name.
   *
   * @param fileName - The name of the config file.
   */
  public setConfigName(fileName: string) {
    this.configName = fileName.endsWith(".json")
      ? fileName.slice(0, -5)
      : fileName;

    logger.debug(`Using config: ${this.configName}`);
  }

  /**
   * Initializes everything needed to begin armying.
   */
  public async init(): Promise<boolean> {
    try {
      if (!this.configName) {
        logger.warn("Config name is not set.");
        return false;
      }

      this.isInitialized = false;
      this.players.clear();
      this.roomNumber = "";
      this.leader = "";
      this.rawConfig = {};

      const serialized = await client.army.loadConfig({
        fileName: this.configName,
      });
      const configResult = Result.deserialize<ArmyConfigPayload, string>(
        serialized,
      );
      if (configResult.isErr()) {
        logger.warn(`Failed to load army config: ${configResult.error}`);
        return false;
      }

      const payload = configResult.value;
      this.configName = payload.configName;
      this.rawConfig = payload.raw;
      this.roomNumber = payload.roomNumber;
      this.leader = payload.leader;
      this.players = new Set(payload.players);

      const args = {
        fileName: this.configName,
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
    const player1 = this.leader || this.getConfigString("Player1", "").trim();

    return (
      Boolean(player1) &&
      this.bot.auth.username.toLowerCase() === player1.toLowerCase()
    );
  }

  public getConfigValue(key: string, defaultValue?: unknown): unknown {
    if (!key) {
      return this.rawConfig;
    }

    if (key.includes(".")) {
      return this.getNestedConfigValue(this.rawConfig, key, defaultValue);
    }

    const value = (this.rawConfig as Record<string, unknown>)[key];
    return value !== undefined ? value : defaultValue;
  }

  public getConfigString(key: string, defaultValue = ""): string {
    const value = this.getConfigValue(key, defaultValue);
    return typeof value === "string" ? value : defaultValue;
  }

  private getNestedConfigValue(
    obj: Record<string, unknown>,
    path: string,
    defaultValue?: unknown,
  ): unknown {
    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object" ||
        !(key in current)
      ) {
        return defaultValue;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return current;
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
