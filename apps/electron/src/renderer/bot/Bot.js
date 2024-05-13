class Bot {
	constructor() {
		if (Bot._instance) throw new Error('bot instance already exists, use Bot.getInstance()');

		/**
		 * @type {Auth}
		 */
		this.auth = new Auth(this);
		/**
		 * @type {Bank}
		 */
		this.bank = new Bank(this);

		/**
		 * @type {Combat}
		 */
		this.combat = new Combat(this);

		/**
		 * @type {World}
		 */
		this.world = new World(this);

		/**
		 * @type {Flash}
		 */
		this.flash = new Flash(this);

		/**
		 * @type {Player}
		 */
		this.player = new Player(this);

		/**
		 * @type {House}
		 */
		this.house = new House(this);

		/**
		 * @type {Settings}
		 */
		this.settings = new Settings(this);

		/**
		 * @type {Packet}
		 */
		this.packet = new Packet(this);

		/**
		 * @type {TempInventory}
		 */
		this.tempInventory = new TempInventory(this);

		/**
		 * @type {Inventory}
		 */
		this.inventory = new Inventory(this);

		/**
		 * @type {Quests}
		 */
		this.quests = new Quests(this);

		this.isRunning = false;

		Bot._instance = this;
	}

	/**
	 * @returns {void}
	 */
	start() {
		this.isRunning = true;
	}

	/**
	 * @returns {void}
	 */
	stop() {
		this.isRunning = false;
	}

	/**
	 * @param {number} ms
	 * @returns {Promise<void>}
	 */
	async sleep(ms) {
		await new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * @param {Function<bool>} condition
	 * @param {Function<bool>} [prerequisite]
	 * @param {number} [timeout=15]
	 * @returns {Promise<void>}
	 */
	async waitUntil(condition, prerequisite = null, timeout = 15) {
		let iterations = 0;
		while (
			(prerequisite ? prerequisite() : this.isRunning && this.auth.loggedIn && Player.alive) &&
			!condition() &&
			(iterations < timeout || timeout === -1)
		) {
			await this.sleep(1000);
			iterations++;
		}
	}

	/**
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
