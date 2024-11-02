import type { Bot } from './Bot';
import { Server, type ServerData } from './struct/Server';

export class Auth {
	public constructor(public bot: Bot) {}

	/**
	 * The username of the current user. This value is set after a successful login.
	 */
	public get username(): string | null {
		return this.bot.flash.get('sfc.myUserName', true);
	}

	/**
	 * The password of the current user. This value is set after a successful login.
	 */
	public get password(): string | null {
		if (this.bot.flash.getStatic('loginInfo') !== '{}') {
			return this.bot.flash.getStatic('loginInfo.strPassword', true);
		}

		return null;
	}

	/**
	 * Whether the user is logged in and connected to a server.
	 */
	public get loggedIn(): boolean {
		return this.bot.flash.get('sfc.isConnected', true) === true;
	}

	/**
	 * Log in with the given account.
	 *
	 * @param username - The username to login with.
	 * @param password - The password to login with.
	 */
	public login(
		username: string | null = null,
		password: string | null = null,
	): boolean {
		if (username && password) {
			this.bot.flash.call('login', username, password);
			return true;
		}

		return false;
	}

	/**
	 * Logs out of the game.
	 */
	public logout(): boolean {
		if (this.loggedIn) {
			this.bot.flash.call('sfc.logout');
			return true;
		}

		return false;
	}

	/**
	 * The list of servers as shown to the client. The value is set after a successful login.
	 */
	public get servers(): Server[] {
		const ret = this.bot.flash.get('serialCmd.servers', true);
		if (Array.isArray(ret)) {
			return ret.map((data) => new Server(data as unknown as ServerData));
		}

		return [];
	}

	/**
	 * Resets the list of servers that is available to the client.
	 */
	public resetServers(): boolean {
		this.bot.flash.call(() => swf.setGameObject('serialCmd.servers', []));
		return true;
	}

	/**
	 * Connects to a server.
	 *
	 * @param name - The name of the server.
	 */
	public connectTo(name: string): boolean {
		return this.bot.flash.call(() => swf.connectTo(name));
	}

	/**
	 * The server IP the client is connected to.
	 */
	public get ip(): string {
		return this.bot.flash.getStatic('serverIP', true)!;
	}

	/**
	 * The server port the client is connected to.
	 */
	public get port(): number {
		return this.bot.flash.getStatic('serverPort', true)!;
	}

	/**
	 * Whether the client has been temporarily kicked from connecting.
	 */
	public isTemporarilyKicked(): boolean {
		return (
			!this.bot.flash.isNull('mcLogin') &&
			!this.bot.flash.isNull('mcLogin.btnLogin') &&
			this.bot.flash.get('mcLogin.btnLogin.visible', true) === false
		);
	}
}
