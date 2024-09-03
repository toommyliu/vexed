import type Bot from './Bot';
import Server from './struct/Server';

class Auth {
	bot: Bot;

	constructor(bot: Bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * The username of the current user. This value is set after a successful login.
	 * @returns {string}
	 */
	get username() {
		return this.bot.flash.call(swf.GetUsername);
	}

	/**
	 * The password of the current user. This value is set after a successful login.
	 * @returns {string}
	 */
	get password() {
		return this.bot.flash.call(swf.GetPassword);
	}

	/**
	 * Whether the user is logged in and connected to a server.
	 * @returns {boolean}
	 */
	get loggedIn() {
		return this.bot.flash.call(swf.IsLoggedIn);
	}

	/**
	 * Log in with the given account or the previous account (if available).
	 * @param {string|null} [username=null] The username to login with.
	 * @param {string|null} [password=null] The password to login with.
	 * @returns {void}
	 */
	login(username: string | null = null, password: string | null = null) {
		if (username && password) {
			this.bot.flash.call(swf.FixLogin, username, password);
		} else {
			this.bot.flash.call(swf.Login);
		}
	}

	/**
	 * Logs out of the current account.
	 * @returns {void}
	 */
	logout() {
		this.bot.flash.call(swf.Logout);
	}

	/**
	 * The list of servers as shown to the client. The list is updated after a successful login.
	 * @returns {Server[]}
	 */
	get servers() {
		const ret = this.bot.flash.get('serialCmd.servers', true);
		if (Array.isArray(ret)) {
			return ret.map((data) => new Server(data));
		}
		return [];
	}

	/**
	 * Resets the list of servers that is available to the client.
	 * @returns {boolean}
	 */
	resetServers() {
		return !this.bot.flash.call(swf.ResetServers);
	}

	/**
	 * Connects to a server.
	 * @param {string} name The name of the server.
	 * @returns {void}
	 */
	connectTo(name: string) {
		this.bot.flash.call(swf.Connect, name);
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

	/**
	 * Whether the client is temporarily kicked from the server.
	 * @returns {boolean}
	 */
	get isTemporarilyKicked() {
		return this.bot.flash.call(swf.IsTemporarilyKicked);
	}
}

export default Auth;
