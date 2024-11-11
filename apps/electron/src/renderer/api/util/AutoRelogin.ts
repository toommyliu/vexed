import { Mutex } from 'async-mutex';
import type { Bot } from '../Bot';

/**
 * Auto Relogins are automatically ran if the bot is running and there has been a selected server.
 * There are no calls needed to enable auto-relogin besides starting the bot and selecting the server to connect to.
 */
export class AutoRelogin {
	private readonly mutex = new Mutex();

	/**
	 * The server name to connect to.
	 */
	public server: string | null;

	/**
	 * The delay after a logout or a disconnect before attempting to login.
	 */
	public delay: number;

	public constructor(public readonly bot: Bot) {
		/**
		 * The server name to connect to.
		 */
		this.server = null;

		/**
		 * The delay after a logout or a disconnect before attempting to login.
		 */
		this.delay = 5_000;

		this.bot.on('logout', () => this.run());
	}

	/**
	 * Runs the auto-login process.
	 */
	private run(): void {
		this.bot.timerManager.setInterval(async () => {
			if (this.mutex.isLocked() || !this.server) {
				return;
			}

			if (!this.bot.auth.isLoggedIn()) {
				void this.mutex.runExclusive(async () => {
					if (this.bot.auth.isTemporarilyKicked()) {
						await this.bot.waitUntil(
							() => !this.bot.auth.isTemporarilyKicked(),
							null,
							-1,
						);
					}

					console.log(
						`AutoRelogin: waiting for ${this.delay}ms`,
						new Date(),
					);
					await this.bot.sleep(this.delay);

					// Check if we're still on the server select screen
					if (
						this.bot.flash.get('mcLogin.currentLabel') ===
						'"Servers"'
					) {
						this.bot.flash.call('removeAllChildren');
						this.bot.flash.call('gotoAndPlay', 'Login');
					}

					if (!this.bot.auth.resetServers()) {
						return;
					}

					await this.bot.sleep(1_000);
					this.bot.auth.login();

					await this.bot.waitUntil(
						() => this.bot.auth.servers.length > 0,
					);

					const server = this.bot.auth.servers.find(
						(srv) =>
							srv.name.toLowerCase() ===
							this.server!.toLowerCase(),
					);

					if (!server) {
						return;
					}

					this.bot.auth.connectTo(server.name);

					await this.bot.waitUntil(() => bot.player.isReady());
					// TODO: restart the script ?
				});
			}
		}, 1_000);
	}
}
