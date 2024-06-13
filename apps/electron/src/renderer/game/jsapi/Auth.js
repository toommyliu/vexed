class Auth {
	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;
	}

	/**
	 * The username of the current user. This value is only updated after logging in.
	 * @returns {string}
	 */
	get username() {
		return this.bot.flash.call(window.swf.GetUsername);
	}

	/**
	 * The password of the current user. This value is only updated after logging in.
	 * @returns {string}
	 */
	get password() {
		return this.bot.flash.call(window.swf.GetPassword);
	}

	/**
	 * Whether the user is logged in and connected to a server.
	 * @returns {boolean}
	 */
	get loggedIn() {
		return this.bot.flash.call(window.swf.IsLoggedIn);
	}

	/**
	 * Log in with the given account or the account cached in memory.
	 * @param {string} [username]
	 * @param {string} [password]
	 * @returns {void}
	 */
	login(username, password) {
		if (username && password) {
			this.bot.flash.call(window.swf.FixLogin, username, password);
		} else {
			this.bot.flash.call(window.swf.Login);
		}
	}

	/**
	 * Logs out of the current account.
	 * @returns {void}
	 */
	logout() {
		this.bot.flash.call(window.swf.Logout);
	}

	/**
	 * The list of servers the client can see. This list is updated after a successful login.
	 * @returns {Server[]}
	 */
	get servers() {
		return (
			this.bot.flash
				.get('serialCmd.servers', true)
				?.map((data) => new Server(data)) ?? []
		);
	}

	/**
	 * Resets the list of servers that is available to the client.
	 * @returns {boolean}
	 */
	resetServers() {
		return !this.bot.flash.call(window.swf.ResetServers);
	}

	/**
	 * Connects to a server.
	 * @param {string} name - The name of the server.
	 * @returns {void}
	 */
	connect(name) {
		this.bot.flash.call(window.swf.Connect, name);
	}

	/**
	 * The server IP the client is connected to.
	 * @returns {string}
	 */
	get ip() {
		return this.bot.flash.getStatic('serverIP', true);
	}

	/**
	 * The server port the client is connected to.
	 * @returns {number}
	 */
	get port() {
		return this.bot.flash.getStatic('serverPort', true);
	}
}
