/**
 *  @description
 * `Provoke Map`: If enabled, tags all monsters in the map.
 * `Provoke Cell`: If enabled, tags all monsters in the current cell.
 * `Enemy Magnet`: If enabled, sets the target's position to that of the player.
 * `Lag Killer`: If enabled, disables rendering of most UI elements.
 * `Hide Players`: If enabled, hides other players.
 * `Skip Cutscenes:` If enabled, skips cutscenes as needed.
 * `Walk Speed`: The player's walk speed.
 *  Settings are updated in a background interval every 500ms.
 */
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
		 * @ignore
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

	/**
	 * The state of "Infinite Range".
	 * @type {boolean}
	 * @property
	 */
	get infiniteRange() {
		return this.#infiniteRange;
	}

	/**
	 * Sets state of "Infinite Range".
	 * @param {boolean} on
	 * @returns {void}
	 */
	set infiniteRange(on) {
		this.#infiniteRange = on;
		this.#updateOption(this.#optionInfiniteRange, on);
	}

	/**
	 * The state of "Provoke Map".
	 * @type {boolean}
	 * @property
	 */
	get provokeMap() {
		return this.#provokeMap;
	}

	/**
	 * Sets state of "Provoke Map".
	 * @param {boolean} on
	 * @returns {void}
	 */
	set provokeMap(on) {
		this.#provokeMap = on;
		this.#updateOption(this.#optionProvokeMap, on);
	}

	/**
	 * The state of "Provoke Cell".
	 * @type {boolean}
	 * @property
	 */
	get provokeCell() {
		return this.#provokeCell;
	}

	/**
	 * Sets state of "Provoke Cell".
	 * @param {boolean} on
	 * @returns {void}
	 */
	set provokeCell(on) {
		this.#provokeCell = on;
		this.#updateOption(this.#optionProvokeCell, on);
	}

	/**
	 * The state of "Enemy Magnet".
	 * @type {boolean}
	 * @property
	 */
	get enemyMagnet() {
		return this.#enemyMagnet;
	}

	/**
	 * Sets state of "Enemy Magnet".
	 * @param {boolean} on
	 * @returns {void}
	 */
	set enemyMagnet(on) {
		this.#enemyMagnet = on;
		this.#updateOption(this.#optionEnemyMagnet, on);
	}

	/**
	 * Whether "Lag Killer" is enabled.
	 * @type {boolean}
	 * @property
	 */
	get lagKiller() {
		return this.#lagKiller;
	}

	/**
	 * Sets state of "Lag Killer".
	 * @param {boolean} on
	 * @returns {void}
	 */
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

	/**
	 * Whether "Hide Players" is enabled.
	 * @type {boolean}
	 * @property
	 */
	get hidePlayers() {
		return this.#hidePlayers;
	}

	/**
	 * Sets state of "Hide Players".
	 * @param {boolean} on
	 * @returns {void}
	 */
	set hidePlayers(on) {
		this.#hidePlayers = on;
		this.#updateOption(this.#optionHidePlayers, on);
		this.bot.flash.call(swf.HidePlayers, this.#hidePlayers);
	}

	/**
	 * Whether "Skip Cutscenes" is enabled.
	 * @type {boolean}
	 * @property
	 */
	get skipCutscenes() {
		return this.#skipCutscenes;
	}

	/**
	 * Sets state of "Skip Cutscenes".
	 * @param {boolean} on
	 * @returns {void}
	 */
	set skipCutscenes(on) {
		this.#skipCutscenes = on;
		this.#updateOption(this.#optionSkipCutscenes, on);
	}

	/**
	 * The player's walk speed.
	 * @type {number}
	 * @property
	 */
	get walkSpeed() {
		return this.#walkSpeed;
	}

	/**
	 * Sets the player's walk speed.
	 * @param {number} speed
	 * @returns {void}
	 */
	set walkSpeed(speed) {
		speed = Math.max(0, Math.min(99, speed));
		this.#walkSpeed = speed;
		this.#updateOption(this.#optionWalkSpeed, speed);
	}

	/**
	 * Sets the target client FPS.
	 * @param {string|number} fps The target fps.
	 * @returns {void}
	 */
	setFPS(fps) {
		this.bot.flash.call(swf.SetFPS, String(fps));
	}

	/**
	 * Sets the visiblity of death ads.
	 * @param {boolean} on If enabled, death ads are shown.
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

export default Settings;
