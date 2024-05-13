class Combat {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		this.instance = instance;

		this.skillSet = [1, 2, 3, 4];
		this.skillSetIdx = 0;
		this.skillDelay = 150;
	}

	attack(name) {
		this.instance.flash.call(window.swf.AttackMonster, name);
	}

	async useSkill(idx, wait = false) {
		const sIdx = String(idx);
		if (wait) {
			await this.instance.sleep(this.instance.flash.call(window.swf.SkillAvailable, sIdx));
		}

		this.instance.flash.call(window.swf.UseSkill, sIdx);
	}

	async forceUseSkill(idx, wait = false) {
		const sIdx = String(idx);
		if (wait) {
			await this.instance.sleep(this.instance.flash.call(window.swf.SkillAvailable, sIdx));
		}

		this.instance.flash.call(window.swf.ForceUseSkill, sIdx);
	}

	get hasTarget() {
		return this.instance.flash.call(window.swf.HasTarget);
	}

	// REST

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
