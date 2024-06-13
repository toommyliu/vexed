class Bot {
	constructor() {
		if (Bot._instance) {
			throw new Error(
				'Bot instance was already constructed, use Bot.getInstance()',
			);
		}

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
	 * Waits until the condition is met.
	 * @param {Function} condition The condition to wait for.
	 * @param {Function|null} prerequisite The prerequisite to be checked before waiting for the condition.
	 * @param {number} timeout The maximum number of iterations to wait. -1 for infinite.
	 * @returns {Promise<void>}
	 */
	async waitUntil(condition, prerequisite = null, timeout = 15) {
		let iterations = 0;

		while (
			(prerequisite === null || prerequisite()) &&
			!condition() &&
			(iterations < timeout || timeout === -1)
		) {
			await this.sleep(1000);
			iterations++;
		}
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
