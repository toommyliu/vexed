var { setIntervalAsync, clearIntervalAsync } = require('set-interval-async');
var { Mutex } = require('async-mutex');

class Combat {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		this.instance = instance;

		/**
		 * The skills to cycle through.
		 * @type {number[]}
		 */
		this.skillSet = [1, 2, 3, 4];

		/**
		 * The index of the skill set to use.
		 * @type {number}
		 * @private
		 */
		this.skillSetIdx = 0;

		/**
		 * The delay between skills.
		 * @type {number}
		 */
		this.skillDelay = 150;

		/**
		 * Internal interval ID.
		 * @type {number}
		 */
		this.intervalId = -1;

		this.mutex = new Mutex();
	}

	/**
	 * Attacks a monster.
	 * @param {string} name - The name of the monster.
	 */
	attack(name) {
		this.instance.flash.call(window.swf.AttackMonster, name);
	}

	/**
	 * Uses a skill.
	 * @param {number|string} idx - The index of the skill; indexes ranges from 1 to 4.
	 * @param {boolean} [wait=false] - Whether to wait for the skill to be available
	 */
	async useSkill(idx, wait = false) {
		const sIdx = String(idx);
		if (wait) {
			await this.instance.sleep(this.instance.flash.call(window.swf.SkillAvailable, sIdx));
		}

		this.instance.flash.call(window.swf.UseSkill, sIdx);
	}

	/**
	 * Uses a skill even if there is no current target.
	 * @param {number|string} idx - The index of the skill; indexes ranges from 1 to 4.
	 * @param {boolean} [wait=false] - Whether to wait for the skill to be available
	 */
	async forceUseSkill(idx, wait = false) {
		const sIdx = String(idx);
		if (wait) {
			await this.instance.sleep(this.instance.flash.call(window.swf.SkillAvailable, sIdx));
		}

		this.instance.flash.call(window.swf.ForceUseSkill, sIdx);
	}

	/**
	 * Whether the current player has a target.
	 * @returns {boolean}
	 */
	get hasTarget() {
		return this.instance.flash.call(window.swf.HasTarget);
	}

	/**
	 * Rests the current player.
	 * @returns {Promise<void>}
	 */
	async rest() {
		await this.instance.waitUntil(() => this.instance.world.isActionAvailable(GameAction.Rest));
		this.instance.flash.call(window.swf.Rest);
	}

	/**
	 * Kills a monster.
	 * @param {string} name - The name of the monster.
	 * @returns {Promise<void>}
	 */
	async kill(name) {
		const getMonster = () =>
			this.instance.world.availableMonsters.find((m) => m.name.toLowerCase() === name.toLowerCase());
		const isMonAlive = () => getMonster()?.alive;

		await this.instance.waitUntil(() => isMonAlive(), null, 3);

		const cond =
			this.instance.isRunning && this.instance.auth.loggedIn && this.instance.player.alive && getMonster()?.alive;
		if (!cond) return;

		this.instance.flash.call(window.swf.AttackMonsterByMonMapId, getMonster()?.monMapId);

		this.intervalId = setIntervalAsync(async () => {
			await this.mutex.acquire();
			if (cond) {
				this.instance.flash.call(window.swf.AttackMonsterByMonMapId, getMonster()?.monMapId);

				if (this.hasTarget) {
					this.useSkill(this.skillSet[this.skillSetIdx], false);
					this.skillSetIdx++;

					// cycle skills
					if (this.skillSetIdx >= this.skillSet.length) {
						this.skillSetIdx = 0;
					}
				}
				await this.instance.sleep(this.skillDelay);
			} else {
				if (!isMonAlive()) {
					(async () => {
						await clearIntervalAsync(this.intervalId);
						// this.intervalId = -1;
					})();
				}
				await this.instance.sleep(1000);
				if (this.instance.player.isAfk) {
					(async () => {
						await clearIntervalAsync(this.intervalId);
						// this.intervalId = -1;
					})();
				}
			}
			this.mutex.release();
		}, 0);

		while (isMonAlive()) {
			// add checks for if the player is dead
			await this.instance.sleep(1000);
		}
	}

	// REFACTOR: killFor()

	/**
	 * Kills a monster for a certain item quantity.
	 * @param {string} name - The name of the monster.
	 * @param {string} item - The name of the item.
	 * @param {string|*|number} quantity - The quantity of the item needed.
	 * @param {boolean} [temp=false] - Whether the item is temporary.
	 * @returns {Promise<void>}
	 */
	async killForItem(name, item, quantity = '*', temp = false) {
		const getItem = () => this.instance[temp ? 'tempInventory' : 'inventory'].resolve(item);
		const getQuantity = () => getItem()?.quantity ?? 0;
		const checkRet = () => (getQuantity() > 1 && quantity === '*') || getQuantity() >= Number.parseInt(quantity);

		console.log(`killForItem: ${name} "${item}" ${getQuantity()}/${quantity} ${temp ? '(temp)' : ''}`);

		if (checkRet()) return;

		await this.kill(name);
		await this.instance.sleep(1000);

		const i = this.instance.drops

		// Item is in dropstack
		if (i) {
			console.log("killForItem", i);
			// await this.instance.world.dropStack.collect(i[0].ItemID);

			if (checkRet()) return;

			await this.killForItem(name, item, quantity, temp);
		} else {
			// Item is in (temp) inventory

			if (checkRet()) return;

			await this.killForItem(name, item, quantity, temp);
		}
	}
}
