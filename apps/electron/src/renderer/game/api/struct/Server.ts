/**
 * Represents a game server.
 */
export class Server {
	public constructor(
		/**
		 * Data about this server.
		 */ public data: ServerData,
	) {}

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
}

export type ServerData = {
	/**
	 * Indicates if the server is online.
	 */
	bOnline: number;
	/**
	 * Indicates if this is an upgrade only server.
	 */
	bUpg: number;
	/**
	 * The chat-level restriction of the server (0=canned, 2=free).
	 */
	iChat: number;
	/**
	 * The number of players currently on the server.
	 */
	iCount: number;
	iLevel: number;
	/**
	 * The maximum number of players allowed on the server.
	 */
	iMax: number;
	/**
	 * The port number the server is on.
	 */
	iPort: number;
	/**
	 * The IP address of the game server.
	 */
	sIP: string;
	/**
	 * The language of this server (en/xx/it/pt).
	 */
	sLang: string;
	/**
	 * The name of the game server.
	 */
	sName: string;
};
