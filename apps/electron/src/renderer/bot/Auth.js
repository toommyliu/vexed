class Auth {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		this.instance = instance;
	}

	/**
	 * @returns {string}
	 */
	get username() {
		return this.instance.flash.call(window.swf.GetUsername);
	}

	/**
	 * @returns {string}
	 */
	get password() {
		return this.instance.flash.call(window.swf.GetPassword);
	}

	/**
	 * @returns {boolean}
	 */
	get loggedIn() {
		return this.instance.flash.call(window.swf.IsLoggedIn);
	}

	/**
	 * @param {string} [username]
	 * @param {string} [password]
	 * @returns {void}
	 */
	login(username, password) {
		if (username && password) {
			this.instance.flash.call(window.swf.FixLogin, username, password);
		} else {
			this.instance.flash.call(window.swf.Login);
		}
	}

	/**
	 * @returns {void}
	 */
	logout() {
		this.instance.flash.call(window.swf.Logout);
	}

	/**
	 * @returns {Server[]}
	 */
	get servers() {
		return (
			this.instance.flash.call(window.swf.getGameObject, 'serialCmd.servers')?.map((data) => new Server(data)) ?? []
		);
	}

	/**
	 * @returns {boolean}
	 */
	resetServers() {
		return !this.instance.flash.call(window.swf.ResetServers);
	}

	/**
	 * @param {string} [name]
	 * @returns {void}
	 */
	connect(name) {
		this.instance.flash.call(window.swf.Connect, name);
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
class Server {
	constructor(data) {
		this.data = data;
	}
}
