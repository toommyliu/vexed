import { Mutex } from 'async-mutex';
import type Bot from '../Bot';
import type { SetIntervalAsyncTimer } from './TimerManager';

/**
 * Auto Relogins are automatically ran if the bot is running and there has been a selected server.
 * There are no calls needed to enable auto-relogin besides starting the bot, and choosing a server.
 */
export class AutoRelogin {
	#intervalID: SetIntervalAsyncTimer<unknown[]> | null = null;

	#mutex = new Mutex();

	public server: string | null;

	public delay: number;

	public constructor(public bot: Bot) {
		/**
		 * The server name to connect to.
		 */
		this.server = null;

		/**
		 * The delay after a logout or a disconnect before attempting to login.
		 */
		this.delay = 5_000;

		// TODO: these might not be removed ?
		this.bot.on('start', this.#run.bind(this));
		this.bot.on('stop', this.#stop.bind(this));
	}

	/**
	 * Runs the auto-login process.
	 */
	#run(): void {
		this.#intervalID = this.bot.timerManager.setInterval(async () => {
			if (this.#mutex.isLocked() || !this.server) {
				return;
			}

			if (this.bot.running && !this.bot.auth.loggedIn) {
				void this.#mutex.runExclusive(async () => {
					console.log(
						`AutoRelogin triggered, waiting for ${this.delay}ms`,
					);
					await this.bot.sleep(this.delay);

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

					await this.bot.waitUntil(
						() =>
							this.bot.auth.loggedIn &&
							!this.bot.world.loading &&
							this.bot.player.isLoaded(),
					);

					// TODO: restart the script ?
				});
			}
		}, 1_000);
	}

	/**
	 * Stops the auto-login task.
	 */
	#stop(): void {
		if (this.#intervalID) {
			void this.bot.timerManager.clearInterval(this.#intervalID);
			this.#intervalID = null;
		}
	}
}
