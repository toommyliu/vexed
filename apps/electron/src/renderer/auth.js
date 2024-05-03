class Auth {
	/**
	 * @returns {string|null}
	 */
	static get username() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.GetUsername);
	}

	/**
	 * @returns {string|null}
	 */
	static get password() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.GetPassword);
	}

	/**
	 * @returns {boolean}
	 */
	static get loggedIn() {
		return Flash.call(window.swf.IsLoggedIn);
	}

	/**
	 * @param {string} [username]
	 * @param {string} [password]
	 * @returns {void}
	 */
	static login(username, password) {
		if (username && password) {
			if (typeof username !== 'string') throw new Error('username must be a string');
			if (typeof password !== 'string') throw new Error('password must be a string');
			Flash.call(window.swf.FixLogin, username, password);
		} else {
			if (!Auth.username && !Auth.password) throw new Error('login manually once before calling Auth#login');
			Flash.call(window.swf.Login);
		}
	}

	/**
	 * @returns {void}
	 */
	static logout() {
		Flash.call(window.swf.Logout);
	}

	/**
	 * @returns {Server[]}
	 */
	static get servers() {
		return Flash.call(window.swf.getGameObject, 'serialCmd.servers');
	}

	/**
	 * @returns {boolean}
	 */
	static resetServers() {
		return Flash.call(window.swf.ResetServers);
	}

	/**
	 * @param {string} name
	 * @returns {void}
	 */
	static connect(name) {
		if (typeof name !== 'string') throw new Error('server name must be a string');
		if (!Auth.servers.find((s) => s.sName.toLowerCase() === name.toLowerCase()))
			throw new Error('server name not found in list');

		Flash.call(window.swf.Connect, name);
	}
}

/**
 * @typedef {Object} Server
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
