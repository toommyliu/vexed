var { AsyncQueue } = require('@sapphire/async-queue');
var { TimerManager } = require('@sapphire/timer-manager');

class Bot {
	#queue = new AsyncQueue();
	#timer = null;
	#index = 0;
	#commands = [];
	pause = false;
	on = false;
	#data = new Map();

	constructor() {
		this.#commands = [
			{
				type: COMMANDS.WORLD.JOIN,
				args: ['battleontown-100000'],
			},
			{
				type: COMMANDS.COMBAT.KILL,
				args: ['frogzard'],
			},
			{
				type: COMMANDS.WORLD.JOIN,
				args: ['lair-100000'],
			},
			{
				type: COMMANDS.WORLD.MOVE_TO_CELL,
				args: ['Mom', 'Right']
			}
		];
	}

	async start() {
		if (!this.#data.size) {
			const { resolve } = require('path');
			const fs = require('fs-extra');

			const readdir = async (dir) => {
				const dirents = await fs.readdir(dir, { withFileTypes: true });
				const files = await Promise.all(
					dirents.map((dirent) => {
						const res = resolve(dir, dirent.name);
						return dirent.isDirectory() ? readdir(res) : res;
					}),
				);
				return Array.prototype.concat(...files);
			};

			for (const f of await readdir('./src/renderer/game/botting/impl')) {
				const cmd = require(f);
				this.#data.set(cmd.id, cmd.execute);
				console.log(`[bot] registered cmd impl: ${cmd.id}`);
			}

			console.log('[bot] registered commands impl');
		}

		if (this.on) {
			console.log('on');
			return;
		}
		this.on = true;
		this.#index = 0;
		this.addTimer();
		console.log('[bot]', this.#commands);
	}

	addTimer() {
		if (!this.on) {
			return console.log('ret');
		}
		this.#timer = TimerManager.setTimeout(async () => {
			if (this.pause) {
				return;
			}

			if (this.#index >= this.#commands.length) {
				await this.sleep(1000);
				this.stop();
				return;
			}

			await this.#queue.wait();

			const cmd = this.#commands[this.#index];
			console.log(new Date(), `[bot]cmd:${cmd.type}`, cmd.args);

			const fn = this.#data.get(cmd.type);
			if (fn) {
				await fn(this, ...cmd.args);
			} else {
				console.log(`[bot] missing handler for ${cmd.type}`);
			}

			this.#index++;
			this.#queue.shift();
			TimerManager.clearTimeout(this.#timer);
			this.addTimer();
		}, 1000);
	}

	stop() {
		this.#index = 0;
		// this.#commands = [];
		TimerManager.clearTimeout(this.#timer);
		this.#timer = null;
		this.pause = false;
		this.on = false;
		this.#queue.abortAll();
		console.log('[bot]stop');
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
}

var bot = new Bot();
