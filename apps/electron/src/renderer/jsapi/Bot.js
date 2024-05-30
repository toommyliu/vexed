var winston = require("winston");

class Bot {
	constructor() {
		if (Bot._instance)
			throw new Error("Bot instance was already constructed, use Bot.getInstance()");

		this.auth = new Auth(this);
		this.bank = new Bank(this);
		this.combat = new Combat(this);
		this.drops = new Drops(this);
		this.flash = new Flash(this);
		this.drops = new Drops(this);
		this.house = new House(this);
		this.inventory = new Inventory(this);
		this.packets = new Packet(this);
		this.player = new Player(this);
		this.quests = new Quests(this);
		this.settings = new Settings(this);
		this.shops = new Shops(this);
		this.tempInventory = new TempInventory(this);
		this.world = new World(this);

		this.log = winston.createLogger({
			transports: [
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.timestamp({
							format: "YYYY-MM-DD hh:mm:ss A"
						}),
						winston.format.printf(
							({ timestamp, message, level }) =>
								`[${timestamp} ${level.toUpperCase()}] ${message}`
						)
					)
				})
				// new winston.transports.File({
				// 	filename: 'log.txt',
				// 	dirname: window.rootDir ?? './',
				// 	format: winston.format.combine(
				// 		winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }),
				// 		winston.format.printf(({ timestamp, message }) => `[${timestamp}] ${message}`)
				// 	)
				// })
			]
		});

		Bot._instance = this;
	}

	/**
	 * @param {number} ms The number of milliseconds to wait.
	 * @returns {Promise<void>}
	 */
	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Waits until the predicate is met.
	 * @param {Function} predicate The condition to wait for.
	 * @returns {Promise<void>}
	 */
	async waitUntil(predicate) {
		do {
			await this.sleep(1000);
		} while (!predicate());
	}

	/**
	 * Singleton getter for a Bot Instance.
	 * @returns {Bot}
	 * @static
	 */
	static getInstance() {
		Bot._instance ??= new Bot();
		return Bot._instance;
	}
}

/**
 * @type {Bot}
 */
Bot._instance = null;

/**
 * @type {BotInstanceOptions}
 * @typedef
 */
