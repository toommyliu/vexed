class Settings {
	#intervalID = null;
	#infiniteRange = false;
	#provokeMap = false;
	#provokeCell = false;
	#enemyMagnet = false;
	#lagKiller = false;
	#hidePlayers = false;
	#skipCutscenes = false;
	#walkSpeed = 8;

	#optionInfiniteRange = null;
	#optionProvokeMap = null;
	#optionProvokeCell = null;
	#optionEnemyMagnet = null;
	#optionLagKiller = null;
	#optionHidePlayers = null;
	#optionSkipCutscenes = null;
	#optionWalkSpeed = null;

	constructor(bot) {
		/**
		 * @type {import('../api/Bot')}
		 */
		this.bot = bot;

		this.#optionInfiniteRange = document.getElementById(
			'option-infinite-range',
		);
		this.#optionProvokeMap = document.getElementById('option-provoke-map');
		this.#optionProvokeCell = document.getElementById(
			'option-provoke-cell',
		);
		this.#optionEnemyMagnet = document.getElementById(
			'option-enemy-magnet',
		);
		this.#optionLagKiller = document.getElementById('option-lag-killer');
		this.#optionHidePlayers = document.getElementById(
			'option-hide-players',
		);
		this.#optionSkipCutscenes = document.getElementById(
			'option-skip-cutscenes',
		);
		this.#optionWalkSpeed = document.getElementById('option-walkspeed');

		this.#intervalID = this.bot.timerManager.setInterval(() => {
			if (
				!this.bot.auth.loggedIn ||
				this.bot.world.loading ||
				!this.bot.player.loaded
			) {
				return;
			}

			if (this.infiniteRange) {
				this.bot.flash.call(swf.SetInfiniteRange);
			}

			if (this.provokeMap && this.bot.world.monsters.length > 0) {
				const monMapIDs = this.bot.world.monsters.map(
					(mon) => mon.MonMapID,
				);
				this.bot.packets.sendServer(
					`%xt%zm%aggroMon%${this.bot.world.roomID}%${monMapIDs.join('%')}%`,
				);
			}

			if (this.provokeCell) {
				this.bot.flash.call(swf.SetProvokeMonsters);
			}

			if (this.enemyMagnet) {
				this.bot.flash.call(swf.SetEnemyMagnet);
			}

			this.bot.flash.call(
				swf.SetLagKiller,
				this.lagKiller ? 'True' : 'False',
			);

			this.bot.flash.call(swf.HidePlayers, this.hidePlayers);

			if (this.skipCutscenes) {
				this.bot.flash.call(swf.SetSkipCutscenes);
			}

			if (this.walkSpeed !== 8) {
				this.bot.flash.call(swf.SetWalkSpeed, String(this.walkSpeed));
			}
		}, 500);
	}

	get infiniteRange() {
		return this.#infiniteRange;
	}

	set infiniteRange(on) {
		this.#infiniteRange = on;
		this.#updateOption(this.#optionInfiniteRange, on);
	}

	get provokeMap() {
		return this.#provokeMap;
	}

	set provokeMap(on) {
		this.#provokeMap = on;
		this.#updateOption(this.#optionProvokeMap, on);
	}

	get provokeCell() {
		return this.#provokeCell;
	}

	set provokeCell(on) {
		this.#provokeCell = on;
		this.#updateOption(this.#optionProvokeCell, on);
	}

	get enemyMagnet() {
		return this.#enemyMagnet;
	}

	set enemyMagnet(on) {
		this.#enemyMagnet = on;
		this.#updateOption(this.#optionEnemyMagnet, on);
	}

	get lagKiller() {
		return this.#lagKiller;
	}

	set lagKiller(on) {
		this.#lagKiller = on;
		this.#updateOption(this.#optionLagKiller, on);
		// Call immediately
		if (on) {
			this.bot.flash.call(swf.SetLagKiller, 'True');
		} else {
			this.bot.flash.call(swf.SetLagKiller, 'False');
		}
	}

	get hidePlayers() {
		return this.#hidePlayers;
	}

	set hidePlayers(on) {
		this.#hidePlayers = on;
		this.#updateOption(this.#optionHidePlayers, on);
		this.bot.flash.call(swf.HidePlayers, this.#hidePlayers);
	}

	get skipCutscenes() {
		return this.#skipCutscenes;
	}

	set skipCutscenes(on) {
		this.#skipCutscenes = on;
		this.#updateOption(this.#optionSkipCutscenes, on);
	}

	get walkSpeed() {
		return this.#walkSpeed;
	}

	set walkSpeed(speed) {
		speed = Math.max(0, Math.min(99, speed));
		this.#walkSpeed = speed;
		this.#updateOption(this.#optionWalkSpeed, speed);
	}

	/**
	 * Sets the target client FPS.
	 * @param {string|number} fps
	 * @returns {void}
	 */
	setFPS(fps) {
		this.bot.flash.call(swf.SetFPS, String(fps));
	}

	/**
	 * Sets the visiblity of death ads.
	 * @param {boolean} on
	 * @returns {void}
	 */
	setDeathAds(on) {
		this.bot.flash.set('userPreference.data.bDeathAd', on);
	}

	/**
	 * Updates an option.
	 * @param {HTMLElement} option
	 * @param {string} value
	 */
	#updateOption(option, value) {
		switch (option.tagName) {
			case 'INPUT':
				option.value = value;
				break;
			case 'BUTTON':
				option.setAttribute('data-checked', value ? 'true' : 'false');
				option.querySelector('.checkmark').style.display = value
					? 'block'
					: 'none';
				break;
		}
	}
}

module.exports = Settings;
