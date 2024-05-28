// DONE
class Settings {
	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;
	}

	/**
	 * Allows the current player to attack from any range.
	 * @returns {void}
	 */
	setInfiniteRange() {
		this.bot.flash.call(window.swf.SetInfiniteRange);
	}

	/**
	 * Prompts all cell monsters to attack the current player.
	 * @returns {void}
	 */
	setProvokeMonsters() {
		this.bot.flash.call(window.swf.SetProvokeMonsters);
	}

	/**
	 * Sets all cell monsters to sit on the current player.
	 * @returns {void}
	 */
	setEnemyMagnet() {
		this.bot.flash.call(window.swf.SetEnemyMagnet);
	}

	/**
	 * Whether to disable drawing of the game.
	 * @param {boolean} on
	 */
	setLagKiller(on) {
		this.bot.flash.call(window.swf.SetLagKiller, on ? 'True' : 'False');
	}

	/**
	 * Hides players in the world.
	 * @returns {void}
	 */
	hidePlayers() {
		this.bot.flash.call(window.swf.DestroyPlayers);
	}

	/**
	 * Skips cutscenes.
	 * @returns {void}
	 */
	skipCutscenes() {
		this.bot.flash.call(window.swf.SetSkipCutscenes);
	}

	/**
	 * Sets the current player's walk speed.
	 * @param {number|string} walkSpeed
	 */
	setWalkSpeed(walkSpeed) {
		this.bot.flash.call(window.swf.SetWalkSpeed, String(walkSpeed));
	}

	/**
	 * Sets the client's target fps.
	 * @param {string|number} fps The client fps.
	 * @returns {void}
	*/
	setFPS(fps) {
		this.bot.flash.call(window.swf.SetFPS, String(fps));
	}
}
