var { AsyncQueue } = require('@sapphire/async-queue');
var { TimerManager } = require('@sapphire/timer-manager');

class Bot {
	#queue = new AsyncQueue();
	#timer = null;
	#index = 0;
	#commands = [];
	#paused = false;
	running = false;
	#data = new Map();

	constructor() {
		this.#commands = [
			{
				id: COMMANDS.WORLD.JOIN,
				args: ['classhall-100000', 'r4f', 'Right'],
			},
			{
				id: COMMANDS.COMBAT.KILL,
				args: ['elite dummy'],
			},
			{
				id: COMMANDS.WORLD.JOIN,
				args: ['nexus-1000000'],
			},
			{
				id: COMMANDS.COMBAT.KILL,
				args: ['*']
			},
			{
				id: COMMANDS.WORLD.JOIN,
				args: ['battleontown-100000'],
			},
			{
				id: COMMANDS.COMBAT.KILL,
				args: ['frogzard'],
			},
			{
				id: COMMANDS.WORLD.JOIN,
				args: ['lair-100000'],
			},
			{
				id: COMMANDS.WORLD.JUMP,
				args: ['Mom', 'Right'],
			},
			{
				id: COMMANDS.COMBAT.ATTACK,
				args: ['*']
			},
			{
				id: COMMANDS.WORLD.JOIN,
				args: ['lavarockshore-1000000', 'r2', 'Left'],
			},
			{
				id: COMMANDS.COMBAT.ATTACK,
				args: ['id:1'],
			},
			{
				id: COMMANDS.UTIL.SLEEP,
				args: [1000],
			},
			{
				id: COMMANDS.COMBAT.REST,
				args: [true],
			},
			{
				id: COMMANDS.WORLD.JOIN,
				args: ['battleon-1000000'],
			},
		];
	}

	pause() {
		if (this.#paused) {
			throw new Error('bot is already paused');
		}

		this.#paused = true;
	}

	resume() {
		if (!this.#paused) {
			throw new Error('bot is not paused');
		}

		this.#paused = false;
	}

	isPaused() {
		return this.#paused;
	}

	addCommand(id, ...args) {
		this.#commands.push({
			id,
			args: [...args],
		});
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
			}

			console.log(`[bot] registered commands impl (${this.#data.size})`);
		}

		this.running = true;
		this.#index = 0;
		this.addTimer();

		console.log(`[bot] running ${this.#commands.length} commands`);
	}

	addTimer() {
		this.#timer = TimerManager.setTimeout(async () => {
			if (this.isPaused()) {
				return;
			}

			if (this.#index >= this.#commands.length) {
				await this.sleep(1000);
				this.stop();
				return;
			}

			await this.#queue.wait();

			const cmd = this.#commands[this.#index];
			console.log(
				new Date(),
				`[bot] cmd: ${cmd.id} (${this.#index + 1}/${this.#commands.length})`,
				cmd.args,
			);

			const fn = this.#data.get(cmd.id);
			if (fn) {
				await fn(this, ...cmd.args);
			} else {
				console.log(`[bot] missing handler for ${cmd.id}`);
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
		this.#paused = false;
		this.running = false;
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
