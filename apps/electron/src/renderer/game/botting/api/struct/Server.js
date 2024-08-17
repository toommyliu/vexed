/**
 * Represents a game server.
 */
class Server {
	constructor(data) {
		/**
		 * Data about this server.
		 * @type {ServerData}
		 */
		this.data = data;
	}

	/**
	 * The maximum number of players.
	 * @returns {number}
	 */
	get maxPlayers() {
		return this.data.iMax;
	}

	/**
	 * The port number the server is on.
	 * @returns {number}
	 */
	get port() {
		return this.data.iPort;
	}

	/**
	 * The language of the server (en/xx/it/pt).
	 * @returns {string}
	 */
	get langCode() {
		return this.data.sLang;
	}

	/**
	 * The name of the server.
	 * @returns {string}
	 */
	get name() {
		return this.data.sName;
	}

	/**
	 * The IP address of the server.
	 * @returns {string}
	 */
	get ip() {
		return this.data.sIP;
	}

	/**
	 * The number of current players.
	 * @returns {number}
	 */
	get playerCount() {
		return this.data.iCount;
	}

	/**
	 * Whether the server is an upgrade-only server.
	 * @returns {boolean}
	 */
	isUpgrade() {
		return this.data.bUpg === 1;
	}

	/**
	 * The chat-level restriction of the server (0=canned, 2=free).
	 * @returns {boolean}
	 */
	isCanned() {
		return this.data.iChat === 0;
	}
}

module.exports = Server;

/**
 * @typedef {Object} ServerData
 * @property {boolean} bOnline Indicates whether or not the server is online.
 * @property {boolean} bUpg Indicates whether this is an upgrade only server.
 * @property {string} sIP The IP address of the game server.
 * @property {string} sLang The language of this server (en/pt).
 * @property {string} sName The name of the game server.
 * @property {number} iChat The chat level of this server (canned = 0, free = 2).
 * @property {number} iCount The number of players currently on the server.
 * @property {number} iLevel
 * @property {number} iMax The maximum number of players allowed on the server.
 * @property {number} iPort The port this server listens on.
 */
