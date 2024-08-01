class AutoRelogin {
	/**
	 * The server name to connect to.
	 * @type {string}
	 */
	server;

	/**
	 * The delay after a logout or a disconnect before attempting to login.
	 * @type {number}
	 */
	delay = 5000;

	#busy = false;
	#intervalID = null;

	constructor(bot) {
		/**
		 * @type {import('../api/Bot')}
		 */
		this.bot = bot;

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
			if (this.#busy || !this.server) {
				return;
			};

			if (this.bot.running && !this.bot.auth.loggedIn) {
				this.#busy = true;
				console.log(
					`AutoRelogin triggered, waiting for ${this.delay}ms`,
				);
				await this.bot.sleep(this.delay);

				try {
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
							this.server.toLowerCase(),
					);

					if (!server) {
						// console.log('server not found');
						return;
					}

					// console.log('connecting to ' + this.server);
					this.bot.auth.connectTo(this.server);

					await this.bot.waitUntil(
						() =>
							this.bot.auth.loggedIn &&
							!this.bot.world.loading &&
							this.bot.player.loaded,
					);

					// console.log('connected');
					// TODO: restart the script ?
				} finally {
					this.#busy = false;
				}
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
		this.#busy = false;
		console.log('AutoRelogin stopped');
	}
}

module.exports = AutoRelogin;
