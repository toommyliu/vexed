const { EventEmitter } = require('events');

const Auth = require('./botting/api/Auth');
const Bank = require('./botting/api/Bank');
const Combat = require('./botting/api/Combat');
const Drops = require('./botting/api/Drops');
const House = require('./botting/api/House');
const Inventory = require('./botting/api/Inventory');
const Player = require('./botting/api/Player');
const Packets = require('./botting/api/Packets');
const Quests = require('./botting/api/Quests');
const Settings = require('./botting/api/Settings');
const Shops = require('./botting/api/Shop');
const TempInventory = require('./botting/api/TempInventory');
const World = require('./botting/api/World');

const AutoRelogin = require('./botting/util/AutoRelogin');
const Flash = require('./botting/util/Flash');
const TimerManager = require('./botting/util/TimerManager');

class Bot extends EventEmitter {
	/**
	 * @type {AbortController}
	 */
	#ac;

	constructor() {
		super();

		if (Bot._instance) {
			throw new Error('Bot is a singleton, use Bot.getInstance()');
		}

		this._instance = this;

		/**
		 * @type {import('../util/AutoRelogin')}
		 */
		this.autoRelogin = new AutoRelogin(this);

		/**
		 * @type {import('../util/Flash')}
		 */
		this.flash = new Flash();

		/**
		 * @type {import('../util/TimerManager')}
		 */
		this.timerManager = new TimerManager();

		/**
		 * @type {import('./Auth')}
		 */
		this.auth = new Auth(this);

		/**
		 * @type {import('./Bank')}
		 */
		this.bank = new Bank(this);

		/**
		 * @type {import('./Combat')}
		 */
		this.combat = new Combat(this);

		/**
		 * @type {import('./Drops')}
		 */
		this.drops = new Drops(this);

		/**
		 * @type {import('./House')}
		 */
		this.house = new House(this);

		/**
		 * @type {import('./Inventory')}
		 */
		this.inventory = new Inventory(this);

		/**
		 * @type {import('./Player')}
		 */
		this.player = new Player(this);

		/**
		 * @type {import('./Packets')}
		 */
		this.packets = new Packets(this);

		/**
		 * @type {import('./Quests')}
		 */
		this.quests = new Quests(this);

		/**
		 * @type {import('./Settings')}
		 */
		this.settings = new Settings(this);

		/**
		 * @type {import('./Shop')}
		 */
		this.shops = new Shops(this);

		/**
		 * @type {import('./TempInventory')}
		 */
		this.tempInventory = new TempInventory(this);

		/**
		 * @type {import('./World')}
		 */
		this.world = new World(this);
	}

	/**
	 * @param {number} ms The number of milliseconds to wait.
	 * @returns {Promise<void>}
	 */
	sleep(ms) {
		return new Promise((resolve) => {
			let id = this.timerManager.setTimeout(() => {
				this.timerManager.clearTimeout(id);
				resolve();
			}, ms);
		});
	}

	/**
	 * Waits until the condition is met. This only blocks in the current context.
	 * @param {Function} condition The condition to wait for.
	 * @param {Function|null} prerequisite The prerequisite to be checked before waiting for the condition.
	 * @param {number} timeout The maximum number of iterations to wait. -1 to wait indefinitely.
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
	 * Raises the running flag. While this does not start a script, it setups various tasks used during a script's runtime. For example, the auto relogin background task.
	 * @returns {void}
	 */
	start() {
		if (this.#ac) {
			console.log('Bot is already started');
			return;
		}

		this.emit('start');
		this.#ac = new AbortController();
	}

	/**
	 * Lowers the running flag. While this does not stop a script, it removes any background tasks that were set up on start.
	 * @returns {void}
	 */
	stop() {
		if (!this.#ac) {
			console.log('Bot is already stopped');
			return;
		}

		this.emit('stop');
		this.#ac = null;
	}

	/**
	 * Whether the bot is running.
	 * @returns {boolean}
	 */
	get running() {
		return !this.#ac.signal.aborted;
	}

	/**
	 * Gets the singleton instance of the Bot class.
	 * @returns {Bot}
	 */
	static getInstance() {
		Bot._instance ??= new Bot();
		return Bot._instance;
	}
}

window.Bot = Bot;
window.bot = Bot.getInstance();
window.auth = window.bot.auth;
window.bank = window.bot.bank;
window.combat = window.bot.combat;
window.drops = window.bot.drops;
window.flash = window.bot.flash;
window.house = window.bot.house;
window.inventory = window.bot.inventory;
window.player = window.bot.player;
window.packets = window.bot.packets;
window.quests = window.bot.quests;
window.settings = window.bot.settings;
window.shops = window.bot.shops;
window.tempInventory = window.bot.tempInventory;
window.world = window.bot.world;

module.exports = Bot;
