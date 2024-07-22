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

	constructor(bot) {
		/**
		 * @type {import('../api/Bot')}
		 */
		this.bot = bot;

		this.bot.on('start', this.start.bind(this));
		this.bot.on('stop', this.stop.bind(this));
	}

	start() {
		window.connection = ([state]) => {
			if (state === 'OnConnection') {
				this.bot.emit('login');
			} else if (state === 'OnConnectionLost') {
				this.bot.emit('logout');
				this.#run();
			}
		};
	}

	stop() {
		window.connection = null;
	}

	/**
	 * Runs the auto-login process.
	 * @returns {void}
	 */
	#run() {
		const timerID = this.bot.timerManager.setTimeout(async () => {
			if (this.bot.auth.resetServers()) {
				await this.bot.waitUntil(
					() => this.bot.auth.servers.length <= 0,
				);
				this.bot.auth.login();
				await this.bot.waitUntil(
					() => this.bot.auth.servers.length > 0,
					() => this.bot.auth.loggedIn,
				);

				this.bot.auth.connectTo(this.server);
				await this.bot.waitUntil(
					() => {
						const server = this.bot.flash.get(
							'objServerInfo',
							true,
						);
						return (
							server.sName.toLowerCase() ===
							this.server.toLowerCase()
						);
					},
					() => this.bot.auth.loggedIn,
				);
				this.bot.timerManager.clearTimeout(timerID);
			}
		}, this.delay);
	}
}

module.exports = AutoRelogin;
