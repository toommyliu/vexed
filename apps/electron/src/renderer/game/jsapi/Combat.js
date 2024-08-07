var {
	setIntervalAsync,
	clearIntervalAsync,
} = require('set-interval-async/fixed');

class Combat {
	#skillSetIdx = 0;

	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;

		/**
		 * The skills to cycle through.
		 * @type {number[]}
		 */
		this.skillSet = [1, 2, 3, 4];

		/**
		 * The delay between skills.
		 * @type {number}
		 */
		this.skillDelay = 150;

		this.pauseAttack = false;
	}

	/**
	 * Attacks a monster.
	 * @param {string} monsterResolvable The name or monMapID of the monster.
	 * @returns {void}
	 */
	attack(monsterResolvable) {
		if (
			["id'", 'id.', 'id:', 'id-'].some((prefix) =>
				monsterResolvable.startsWith(prefix),
			)
		) {
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
		if (wait) {
			await this.bot.sleep(
				this.bot.flash.call(window.swf.SkillAvailable, sIdx),
			);
		}
		this.bot.flash.call(fn, sIdx);
	}

	/**
	 * Whether the current player has a target.
	 * @returns {boolean}
	 */
	hasTarget() {
		return this.bot.flash.call(window.swf.HasTarget);
	}

	/**
	 * @returns {void}
	 */
	cancelTarget() {
		this.bot.flash.call(window.swf.CancelTarget);
	}

	/**
	 * @returns {void}
	 */
	cancelAttack() {
		this.bot.flash.call(window.swf.CancelAutoAttack);
	}

	/**
	 * Rests the current player.
	 * @returns {Promise<void>}
	 */
	async rest() {
		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.Rest),
		);
		this.bot.flash.call(window.swf.Rest);
	}

	/**
	 * Kills a monster.
	 * @param {string} name The name or monMapID of the monster.
	 * @param {string|string[]} killPriority Specifies the kill order, before the main monster.
	 * @returns {Promise<void>}
	 */
	async kill(name, killPriority = []) {
		await this.bot.waitUntil(
			() => this.bot.world.isMonsterAvailable(name),
			null,
			3,
		);

		if (!this.bot.player.alive || !this.bot.auth.loggedIn) {
			return;
		}

		let timer_a;
		let timer_b;

		return new Promise((res) => {
			timer_a = setIntervalAsync(async () => {
				if (this.pauseAttack) {
					await this.bot.sleep(100);
				} else {
					const _name = name.toLowerCase();
					if (
						_name === 'escherion' &&
						this.bot.world.isMonsterAvailable('Staff of Inversion')
					) {
						this.attack('Staff of Inversion');
					} else if (
						_name === 'vath' &&
						this.bot.world.isMonsterAvailable('Stalagbite')
					) {
						this.attack('Stalagbite');
					}

					let kp;
					if (typeof killPriority === 'string') {
						kp = killPriority.split(',');
					} else if (Array.isArray(killPriority)) {
						kp = killPriority;
					}

					if (kp.length > 0) {
						for (const _kp of kp) {
							if (this.bot.world.isMonsterAvailable(_kp)) {
								this.attack(_kp);
								break;
							}
						}
					}

					if (!this.hasTarget()) {
						this.attack(name);
					}

					if (this.hasTarget()) {
						await this.useSkill(
							this.skillSet[this.#skillSetIdx++],
							false,
							false,
						);

						if (this.#skillSetIdx >= this.skillSet.length) {
							this.#skillSetIdx = 0;
						}

						await this.bot.sleep(this.skillDelay);
					}
				}
			}, this.skillDelay);

			setTimeout(() => {
				timer_b = setIntervalAsync(async () => {
					// ideally we check if we killed BOTH killPriority and name
					if (!this.hasTarget() && !this.pauseAttack) {
						clearIntervalAsync(timer_a);
						clearIntervalAsync(timer_b);

						this.cancelAttack();
						this.cancelTarget();

						this.#skillSetIdx = 1;

						res();
					}
				}, 0);
			}, this.skillDelay);
		});
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
		const getItem = () =>
			this.bot[isTemp ? 'tempInventory' : 'inventory'].resolve(
				itemResolvable,
			);

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
