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

	constructor(bot) {
		/**
		 * @type {import('../api/Bot')}
		 */
		this.bot = bot;

		this.#intervalID = this.bot.timerManager.setInterval(() => {
			if (
				!this.bot.auth.loggedIn ||
				this.bot.world.loading ||
				this.bot.player.loading
			) {
				return;
			}

			if (this.infiniteRange) {
				this.bot.flash.call(swf.SetInfiniteRange);
			}

			if (this.provokeMap) {
				if (this.bot.world.monsters.length > 0) {
					const monMapIDs = this.bot.world.monsters.map(
						(mon) => mon.MonMapID,
					);
					this.bot.packets.sendServer(
						`%xt%zm%aggroMon%${this.bot.world.roomID}%${monMapIDs.join('%')}%`,
					);
				}
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
	}

	get provokeMap() {
		return this.#provokeMap;
	}

	set provokeMap(on) {
		this.#provokeMap = on;
	}

	get provokeCell() {
		return this.#provokeCell;
	}

	set provokeCell(on) {
		this.#provokeCell = on;
	}

	get enemyMagnet() {
		return this.#enemyMagnet;
	}

	set enemyMagnet(on) {
		this.#enemyMagnet = on;
	}

	get lagKiller() {
		return this.#lagKiller;
	}

	set lagKiller(on) {
		this.#lagKiller = on;
	}

	get hidePlayers() {
		return this.#hidePlayers;
	}

	set hidePlayers(on) {
		this.#hidePlayers = on;
	}

	get skipCutscenes() {
		return this.#skipCutscenes;
	}

	set skipCutscenes(on) {
		this.#skipCutscenes = on;
	}

	get walkSpeed() {
		return this.#walkSpeed;
	}

	set walkSpeed(speed) {
		this.#walkSpeed = speed;
	}

	setFPS(fps) {
		this.bot.flash.call(swf.SetFPS, String(fps));
	}

	/**
	 * Whether death ads should be shown.
	 * @param {boolean} on
	 * @returns {void}
	 */
	setDeathAds(on) {
		this.bot.flash.set('userPreference.data.bDeathAd', on);
	}
}

module.exports = Settings;
