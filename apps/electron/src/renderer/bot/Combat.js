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
	 * @returns {void}
	 */
	rest() {
		this.instance.flash.call(window.swf.Rest);
	}

	/**
	 * Kills a monster.
	 * @param {string} name - The name of the monster.
	 * @returns {Promise<void>}
	 */
	async kill(name) {
		const isMonAlive = () => this.instance.flash.call(window.swf.IsMonsterAvailable, name);

		await this.instance.waitUntil(isMonAlive, null, 3);

		if (!this.instance.isRunning || !this.instance.auth.loggedIn || !this.instance.player.alive) {
			return;
		}

		this.attack(name);

		while (isMonAlive() && this.instance.isRunning) {
			if (this.hasTarget) {
				this.useSkill(this.skillSet[this.skillSetIdx], false);
				this.skillSetIdx++;

				// cycle skills
				if (this.skillSetIdx >= this.skillSet.length) {
					this.skillSetIdx = 0;
				}
			}
			await this.instance.sleep(this.skillDelay);
		}
	}

	// async killForItem(name, item, quantity = '*') {}
}
