class Settings {
	#intervalID = null;
	/**
	 * Whether skills can be casted with no range limit.
	 * @type {boolean}
	 */
	infiniteRange = false;
	/**
	 * Whether to aggro all monsters in the map.
	 * @type {boolean}
	 */
	provokeMap = false;
	/**
	 * Whether to aggro all monsters in the cell.
	 * @type {boolean}
	 */
	provokeCell = false;
	/**
	 * Whether to "magnetize" the current target, or set the world position of the current target to that of the player.
	 * @returns {boolean}
	 */
	enemyMagnet = false;
	/**
	 * Whether to mostly disable the ui from rendering.
	 * @type {boolean}
	 */
	lagKiller = false;
	/**
	 * Whether to toggle visiblity of players in the map.
	 * @type {boolean}
	 */
	hidePlayers = false;
	/**
	 * Whether to skip cutscenes when as soon as they play.
	 * @type {boolean}
	 */
	skipCutscenes = false;
	/**
	 * The walk speed of the player.
	 * @type {number}
	 */
	walkSpeed = 8;

	constructor(bot) {
		/**
		 * @type {import('../api/Bot')}
		 */
		this.bot = bot;

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
