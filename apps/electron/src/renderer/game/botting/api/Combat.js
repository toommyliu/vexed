class Combat {
	constructor(bot) {
		/**
		 * @type {import('./Bot')}
		 */
		this.bot = bot;

		/**
		 * The order of skills to use.
		 * @type {number[]}
		 */
		this.skillSet = [1, 2, 3, 4];

		/**
		 * The delay between a skill cast.
		 * @type {number}
		 */
		this.skillDelay = 150;

		/**
		 * Whether to temporarily stop attacking.
		 * @type {boolean}
		 */
		this.pauseAttack = false;
	}

	/**
	 * Whether the player has a target.
	 * @returns {boolean}
	 */
	hasTarget() {
		return !!this.bot.flash.call(swf.HasTarget);
	}

	/**
	 * Returns information about the target.
	 * @returns {Record<string, unknown>|null}
	 */
	get target() {
		// prettier-ignore
		if (this.hasTarget()) {
			const objData = this.bot.flash.get('world.myAvatar.target.objData', true);
			const dataLeaf = this.bot.flash.get('world.myAvatar.target.dataLeaf', true);

			const ret = {
				name: objData.strMonName ?? objData.strUsername,
				hp: dataLeaf.intHP,
				maxHP: dataLeaf.intHPMax,
				cell: dataLeaf.strFrame,
				level: dataLeaf.iLvl ?? dataLeaf.intLevel,
				state: dataLeaf.intState,
			};

			if (ret.entType && ret.entType === 'p') {
				ret.monID = dataLeaf.MonID;
				ret.monMapID = dataLeaf.MonMapID;
			}

			return ret;
		}
		return null;
	}

	/**
	 * Uses a skill.
	 * @param {string|number} index The index of the skill. Skills range from 0 (skill 1) to 5 (potions).
	 * @param {boolean} force Whether to use the skill regardless if there is a target.
	 * @param {boolean} wait Whether to wait for the skill to be available.
	 * @returns {Promise<void>}
	 */
	async useSkill(index, force = false, wait = false) {
		const fn = force ? swf.ForceUseSkill : swf.UseSkill;
		if (wait) {
			await this.bot.sleep(swf.SkillAvailable(index));
		}
		fn(index);
	}

	/**
	 * Attacks a monster.
	 * @param {string} monsterResolvable The name or monMapID of the monster.
	 * @returns {void}
	 */
	attack(monsterResolvable) {
		// prettier-ignore
		if (["id'", 'id.', 'id:', 'id-'].some((prefix) => monsterResolvable.startsWith(prefix))) {
			const monMapID = monsterResolvable.substring(3);
			this.bot.flash.call(swf.AttackMonsterByMonMapId, monMapID);
			return;
		}
		this.bot.flash.call(swf.AttackMonster, monsterResolvable);
	}

	/**
	 * Cancels the current target.
	 * @returns {void}
	 */
	cancelTarget() {
		this.bot.flash.call(swf.CancelTarget);
	}

	/**
	 * Cancels an auto attack.
	 * @returns {void}
	 */
	cancelAutoAttack() {
		this.bot.flash.call(swf.CancelAutoAttack);
	}

	/**
	 * Kills a monster.
	 * @param {string} monsterResolvable The name or monMapID of the monster.
	 * @param {string|string[]} killPriority The priority of the monsters to kill.
	 * @returns {Promise<void>}
	 */
	async kill(monsterResolvable, killPriority = []) {
		await this.bot.waitUntil(
			() => this.bot.world.isMonsterAvailable(monsterResolvable),
			null,
			3,
		);

		if (!this.bot.player.alive || !this.bot.auth.loggedIn) {
			return;
		}

		let timer_a;
		let timer_b;

		let index = 0;

		return new Promise((resolve) => {
			timer_a = this.bot.timerManager.setInterval(async () => {
				if (this.pauseAttack) {
					return;
				}

				const _name = monsterResolvable.toLowerCase();
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
					this.attack(monsterResolvable);
				}

				if (this.hasTarget()) {
					await this.useSkill(this.skillSet[index++]);
					if (index >= this.skillSet.length) {
						index = 0;
					}
					await this.bot.sleep(this.skillDelay);
				}
			}, 0);

			this.bot.timerManager.setTimeout(() => {
				timer_b = this.bot.timerManager.setInterval(async () => {
					// TODO: improve kill detection
					if (
						(!this.hasTarget() ||
							(this.bot.player.state === PlayerState.Idle &&
								!this.bot.player.afk)) &&
						!this.pauseAttack
					) {
						this.bot.timerManager.clearInterval(timer_a);
						this.bot.timerManager.clearInterval(timer_b);

						await this.exit();

						resolve();
					}
				}, 0);
			}, this.skillDelay);
		});
	}

	/**
	 * Kills the monster until the expected quantity of the item is collected in the Inventory.
	 * @param {string} monsterResolvable The name or monMapID of the monster.
	 * @param {string} itemName The name or ID of the item.
	 * @param {number} targetQty The quantity of the item.
	 * @returns {Promise<void>}
	 */
	async killForItem(monsterResolvable, itemName, targetQty) {
		return this.#killForItem(monsterResolvable, itemName, targetQty);
	}

	/**
	 * Kills the monster until the expected quantity of the item is collected in the Temp Inventory.
	 * @param {string} monsterResolvable The name or monMapID of the monster.
	 * @param {string} itemName The name or ID of the item.
	 * @param {number} targetQty The quantity of the item.
	 * @returns {Promise<void>}
	 */
	async killForTempItem(monsterResolvable, itemName, targetQty) {
		return this.#killForItem(monsterResolvable, itemName, targetQty, true);
	}

	/**
	 * Kills the monster until the expected quantity of the item is collected in given store.
	 * @param {string} monsterResolvable The name or monMapID of the monster.
	 * @param {string} itemName The name or ID of the item.
	 * @param {number} targetQty The quantity of the item.
	 * @param {boolean} isTemp Whether the item is in the temp inventory.
	 * @returns {Promise<void>}
	 * @private
	 */
	async #killForItem(monsterResolvable, itemName, targetQty, isTemp = false) {
		const store = isTemp ? this.bot.tempInventory : this.bot.inventory;
		const getItem = () => store.get(itemName);

		const shouldExit = () => {
			const item = getItem();

			if (!item) {
				return false;
			}

			return store.contains(itemName, targetQty);
		};

		while (!shouldExit()) {
			await this.kill(monsterResolvable);
			await this.bot.sleep(500);

			if (isTemp) {
				await this.bot.drops.pickup(itemName);
			}

			if (shouldExit()) {
				await this.exit();
				break;
			}
		}
	}

	/**
	 * Attempts to exit from combat.
	 * @returns {Promise<void>}
	 */
	async exit() {
		while (this.bot.player.state === PlayerState.InCombat) {
			this.cancelTarget();
			this.cancelAutoAttack();

			await this.bot.world.jump(
				this.bot.player.cell,
				this.bot.player.pad,
				true,
			);
			await this.bot.waitUntil(
				() => this.bot.player.state !== PlayerState.InCombat,
			);
			await this.bot.sleep(1000);
		}
	}
}

module.exports = Combat;