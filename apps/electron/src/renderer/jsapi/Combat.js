var { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/fixed');

class Combat {
	/**
	* @type {import('set-interval-async').SetIntervalAsyncTimer}
	*/
	#intervalID;

	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		this.bot = bot;

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
	}

	/**
	 * Attacks a monster.
	 * @param {string} monsterResolvable The name or monMapID of the monster.
	 * @returns {void} 
	*/
	attack(monsterResolvable) {
		if (["id'", "id.", "id:", "id-"].some((prefix) => monsterResolvable.startsWith(prefix))) {
			const monMapID = monsterResolvable.substring(3);
			this.bot.flash.call(window.swf.AttackMonsterByMonMapId, monMapID);
			return;
		}
		this.bot.flash.call(window.swf.AttackMonster, monsterResolvable);
	}

	/**
	 * Uses a skill.
	 * @param {number|string} skillIndex The index of the skill; indexes ranges from 1 to 4.
	 * @param {boolean} [force=false] Whether to force the skill to be used (e.g on a random target).
	 * @param {boolean} [wait=false] Whether to wait for the skill to be available
	 */
	async useSkill(skillIndex, force = false, wait = false) {
		const sIdx = String(skillIndex);
		const fn = force ? window.swf.ForceUseSkill : window.swf.UseSkill;
		if (wait)
			await this.bot.sleep(this.bot.flash.call(window.swf.SkillAvailable, sIdx));

		this.bot.flash.call(fn, sIdx);
	}

	/**
	 * Whether the current player has a target.
	 * @returns {boolean}
	 */
	get hasTarget() {
		return this.bot.flash.call(window.swf.HasTarget);
	}

	/**
	 * Rests the current player.
	 * @returns {Promise<void>}
	 */
	async rest() {
		await this.bot.waitUntil(() => this.bot.world.isActionAvailable(GameAction.Rest));
		this.bot.flash.call(window.swf.Rest);
	}

	/**
	 * Kills a monster.
	 * @param {string|number} name The name or monMapID of the monster.
	 * @returns {Promise<void>}
	 */
	async kill(name) {
		this.bot.log.info(`Killing "${name}"`);

		await this.bot.waitUntil(() => this.bot.world.isMonsterAvailable(name));

		this.attack(name);

		this.#intervalID = setIntervalAsync(async () => {
			this.attack(name);

			if (this.hasTarget) {
				await this.useSkill(this.skillSet[this.skillSetIdx++], false, false);

				if (this.skillSetIdx >= this.skillSet.length)
					this.skillSetIdx = 0;
				await this.bot.sleep(this.skillDelay);
			} else {
				(async () => {
					await clearIntervalAsync(this.#intervalID);
				})();
			}
		}, 0);

		while (this.hasTarget) {
			await this.bot.sleep(150);
		}
	}

	/**
	 * Kills a monster for a specific item.
	 * @param {string|number} name The name or monMapID of the monster.
	 * @param {string|number} itemResolvable The name or ID of the item.
	 * @param {number} itemQuantity The quantity of the item.
	 * @param {boolean} [isTemp=false] Whether the item is temporary.
	 * @returns {Promise<void>}
	 */
	async killForItem(name, itemResolvable, itemQuantity, isTemp = false) {
		this.bot.log.info(`Killing "${name}" for x${itemQuantity} "${itemResolvable}" ${isTemp ? "(temp)" : ""}`);

		const getItem = () => isTemp ? this.bot.tempInventory.resolve(itemResolvable) : this.bot.inventory.resolve(itemResolvable);
		const getQuantity = () => getItem()?.quantity ?? 0;

		while (getQuantity() < itemQuantity) {
			await this.kill(name);
			await this.bot.sleep(500);
			if (!isTemp) {
				await this.bot.drops.pickup(itemResolvable);
			}
		}
	}
}