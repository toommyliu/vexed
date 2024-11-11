import type { Bot } from './Bot';
import { Server, type ServerData } from './struct/Server';

export class Auth {
	public constructor(public readonly bot: Bot) {}

	/**
	 * The username of the current user. This value is set after a successful login.
	 */
	public get username(): string {
		return this.bot.flash.call(() => swf.GetUsername());
	}

	/**
	 * The password of the current user. This value is set after a successful login.
	 */
	public get password(): string {
		return this.bot.flash.call(() => swf.GetPassword());
	}

	/**
	 * Whether the user is logged in and connected to a server.
	 */
	public isLoggedIn(): boolean {
		return this.bot.flash.call(() => swf.IsLoggedIn());
	}

	/**
	 * Log in with the given account or the previous account (if available).
	 *
	 * @param username - The username to login with.
	 * @param password - The password to login with.
	 */
	public login(
		username: string | null = null,
		password: string | null = null,
	): void {
		if (username && password) {
			this.bot.flash.call(() => swf.FixLogin(username, password));
		} else {
			this.bot.flash.call(() => swf.Login());
		}
	}

	/**
	 * Logs out of the current account.
	 */
	public logout(): void {
		this.bot.flash.call(() => swf.Logout());
	}

	/**
	 * The list of servers as shown to the client. The value is set after a successful login.
	 */
	public get servers(): Server[] {
		const ret = this.bot.flash.get('serialCmd.servers', true);
		return Array.isArray(ret)
			? ret.map((data) => new Server(data as unknown as ServerData))
			: [];
	}

	/**
	 * Resets the list of servers that is available to the client.
	 */
	public resetServers(): boolean {
		return !this.bot.flash.call(() => swf.ResetServers());
	}

	/**
	 * Connects to a server.
	 *
	 * @param name - The name of the server.
	 */
	public connectTo(name: string): void {
		this.bot.flash.call(() => swf.Connect(name));
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
	 * Whether the client is temporarily kicked from the server.
	 */
	public isTemporarilyKicked(): boolean {
		return this.bot.flash.call(() => swf.IsTemporarilyKicked());
	}
}
