var { Mutex } = require("async-mutex");
var { setIntervalAsync } = require("set-interval-async");

class Drops {
	/**
	 * @type {number}
	 * @private
	 */
	#intervalId;

	/**
	 * Set of items dropped, used for tracking.
	 * @type {Set<ItemData>}
	 * @private
	 */
	#drops = new Set();

	constructor() {
		/**
		 * Items dropped and their quantity.
		 * @type {Collection<string, number>}
		 */
		this.items = new Collection();

		/**
		 * Items to watch for pickup
		 * @type {Set<string>}
		 */
		this.watchList = new Set();

		//this.intervalDelay = 1000;
		//this.mutex = new Mutex();
	}

	/**
	 * Starts an interval to collect certain items.
	 * @returns {Promise<void>}
	 */
	// async start() {
	// 	this.intervalId = setIntervalAsync(async () => {
	// 		for (const item of this.watchList) {
	// 			for (const drop of this.#drops) {
	// 				if (drop.sName.toLowerCase() === item.toLowerCase())
	// 					await this.collect(drop.ItemID);
	// 			}
	// 		}
	// 	}, this.intervalDelay);
	// }

	// /**
	//  * Stops the interval for collecting items.
	//  * @returns {void}
	//  */
	// stop() {
	// 	clearInterval(this.#intervalId);
	// }

	/**
	 * Adds an item to the drop stack.
	 * @param {ItemData} item
	 */
	add(item) {
		this.#drops.add(item);

		const prev = this.items.get(item.sName) ?? 0;
		this.items.set(item.sName, prev + item.iQty);
	}

	/**
	 * Collects an item from the drop stack.
	 * @param {number} itemID - The ID of the item.
	 * @returns {Promise<void>}
	 */
	async collect(itemID) {
		const item = [...this.#drops.values()].find(item => item.ItemID === itemID);
		this.items.delete(item.sName);

		const bot = Bot.getInstance();
		bot.packet.sendServer(`%xt%zm%getDrop%${bot.world.roomId}%${itemID}%`);
		await bot.sleep(300);
	}
}
