import type { ServerData } from "~/shared/types";

/**
 * Represents a game server.
 */
export class Server {
  public constructor(
    /**
     * Data about this server.
     */ public data: ServerData,
  ) { }

  /**
   * The maximum number of players.
   */
  public get maxPlayers(): number {
    return this.data.iMax;
  }

  /**
   * The port number the server is on.
   */
  public get port(): number {
    return this.data.iPort;
  }

  /**
   * The language of the server (en/xx/it/pt).
   */
  public get langCode(): string {
    return this.data.sLang;
  }

  /**
   * The name of the server.
   */
  public get name(): string {
    return this.data.sName;
  }

  /**
   * The IP address of the server.
   */
  public get ip(): string {
    return this.data.sIP;
  }

  /**
   * The number of current players.
   */
  public get playerCount(): number {
    return this.data.iCount;
  }

  /**
   * Whether the server is an upgrade-only server.
   */
  public isUpgrade(): boolean {
    return this.data.bUpg === 1;
  }

  /**
   * The chat-level restriction of the server (0=canned, 2=free).
   */
  public isCanned(): boolean {
    return this.data.iChat === 0;
  }

  /**
   * Whether the server is online.
   */
  public isOnline(): boolean {
    return this.data.bOnline === 1;
  }

  /**
   * Whether the server is full (at or above capacity).
   */
  public isFull(): boolean {
    return this.data.iCount >= this.data.iMax;
  }
}

export type { ServerData } from "~/shared/types";
