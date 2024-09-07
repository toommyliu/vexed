import { Mutex } from 'async-mutex';
import type Bot from '../Bot';

/**
 * @description
 * Auto Relogins are automatically ran if the bot is running and there has been a selected server.
 * There are no calls needed to enable auto-relogin besides starting the bot, and choosing a server.
 */
class AutoRelogin {
	#intervalID = null;
	#mutex = new Mutex();

	bot: Bot;
	server: string | null;
	delay: number;

	constructor(bot: Bot) {
		/**
		 * @type {import('../Bot')}
		 * @ignore
		 */
		this.bot = bot;

		/**
		 * The server name to connect to.
		 * @type {string}
		 */
		this.server = null;

		/**
		 * The delay after a logout or a disconnect before attempting to login.
		 * @type {number}
		 */
		this.delay = 5000;

		// TODO: these might not be removed ?
		this.bot.on('start', this.#run.bind(this));
		this.bot.on('stop', this.#stop.bind(this));
	}

	/**
	 * Runs the auto-login process.
	 * @returns {void}
	 */
	#run() {
		this.#intervalID = this.bot.timerManager.setInterval(async () => {
			if (this.#mutex.isLocked() || !this.server) {
				return;
			}

			if (this.bot.running && !this.bot.auth.loggedIn) {
				this.#mutex.runExclusive(async () => {
					console.log(
						`AutoRelogin triggered, waiting for ${this.delay}ms`,
					);
					await this.bot.sleep(this.delay);

					if (!this.bot.auth.resetServers()) {
						// console.log('Failed to reset servers');
						return;
					}

					await this.bot.sleep(1000);
					// console.log('login');
					this.bot.auth.login();

					await this.bot.waitUntil(
						() => this.bot.auth.servers.length > 0,
					);
					// console.log('got servers');

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
		}, 1000);
	}

	/**
	 * Stops the auto-login task.
	 * @returns {void}
	 */
	#stop() {
		if (this.#intervalID) {
			this.bot.timerManager.clearInterval(this.#intervalID);
			this.#intervalID = null;
		}
		console.log('AutoRelogin stopped');
	}
}

export default AutoRelogin;
