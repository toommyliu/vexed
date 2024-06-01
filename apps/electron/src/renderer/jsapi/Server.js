/**
 * A game server.
 */
class Server {
	constructor(data) {
		/**
		 * @type {ServerData}
		 */
		this.data = data;
	}

	/**
	 * The maximum number of players
	 * @returns {number}
	 */
	get maxPlayers() {
		return this.data.iMax;
	}

	/**
	 * The port number the server is on
	 * @returns {number}
	 */
	get port() {
		return this.data.iPort;
	}

	/**
	 * The language of the server (en/xx/it/pt)
	 * @returns {string}
	 */
	get langCode() {
		return this.data.sLang;
	}

	/**
	 * The name of the server
	 * @returns {string}
	 */
	get name() {
		return this.data.sName;
	}

	/**
	 * The IP address of the server
	 * @returns {string}
	 */
	get ip() {
		return this.data.sIP;
	}

	/**
	 * The number of current players
	 * @returns {number}
	 */
	get playerCount() {
		return this.data.iCount;
	}

	/**
	 * Whether the server is an upgrade-only server
	 * @returns {boolean}
	 */
	get isUpgrade() {
		return this.data.bUpg;
	}

	/**
	 * The chat-level restriction of the server (0=canned, 2=free)
	 * @returns {boolean}
	 */
	get isCanned() {
		return this.data.iChat === 0;
	}
}

/**
 * @typedef {Object} ServerData
 * @property {number} iMax Maximum number of players
 * @property {number} iPort The port number the server is on
 * @property {string} sLang The language of the server (en/pt)
 * @property {string} sName The name of the server
 * @property {string} sIP The IP address of the server
 * @property {number} iCount The number of current players
 * @property {number} bUpg Whether the server is an upgrade-only server
 * @property {number} iLevel
 * @property {number} bOnline Whether the server is online (0, 1)
 * @property {number} iChat The chat-level restriction of the server (0=canned, 2=free)
 */
