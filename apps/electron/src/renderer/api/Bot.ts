import { EventEmitter } from 'events';

import Auth from './Auth';
import Bank from './Bank';
import Combat from './Combat';
import Drops from './Drops';
import House from './House';
import Inventory from './Inventory';
import Player from './Player';
import Packets from './Packets';
import Quests from './Quests';
import Settings from './Settings';
import Shops from './Shop';
import TempInventory from './TempInventory';
import { World } from './World';

import AutoRelogin from './util/AutoRelogin';
import Flash from './util/Flash';
import { TimerManager } from './util/TimerManager';

class Bot extends EventEmitter {
	/**
	 * @type {AbortController}
	 */
	#ac: AbortController | null = null;

	static _instance: Bot | null = null;

	auth: InstanceType<typeof Auth>;
	bank: InstanceType<typeof Bank>;
	combat: InstanceType<typeof Combat>;
	drops: InstanceType<typeof Drops>;
	house: InstanceType<typeof House>;
	inventory: InstanceType<typeof Inventory>;
	player: InstanceType<typeof Player>;
	packets: InstanceType<typeof Packets>;
	quests: InstanceType<typeof Quests>;
	settings: InstanceType<typeof Settings>;
	shops: InstanceType<typeof Shops>;
	tempInventory: InstanceType<typeof TempInventory>;
	world: InstanceType<typeof World>;

	autoRelogin: InstanceType<typeof AutoRelogin>;
	flash: InstanceType<typeof Flash>;
	timerManager: InstanceType<typeof TimerManager>;

	constructor() {
		super();

		if (Bot._instance) {
			throw new Error('Bot is a singleton, use Bot.getInstance()');
		}

		Bot._instance = this;

		/**
		 * @type {import('./util/AutoRelogin')}
		 */
		this.autoRelogin = new AutoRelogin(this);

		/**
		 * @type {import('./util/Flash')}
		 */
		this.flash = new Flash();

		/**
		 * @type {import('./util/TimerManager')}
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
	sleep(ms: number) {
		return new Promise<void>((resolve) => {
			let id = this.timerManager.setTimeout(() => {
				this.timerManager.clearTimeout(id);
				resolve();
			}, ms);
		});
	}

	/**
	 * Waits until the condition is met.
	 * @param {Function} condition The condition to wait for.
	 * @param {Function} [prerequisite=null] The prerequisite to be checked before waiting for the condition.
	 * @param {number} [timeout=15] The maximum number of iterations to wait. -1 to wait indefinitely.
	 * @returns {Promise<void>}
	 */
	async waitUntil(
		condition: () => boolean,
		prerequisite: (() => boolean) | null = null,
		timeout = 15,
	) {
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
		return this.#ac?.signal.aborted ?? false;
	}

	/**
	 * Gets the singleton instance of the Bot class.
	 * @returns {Bot}
	 * @static
	 */
	static getInstance(): Bot {
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

export default Bot;
