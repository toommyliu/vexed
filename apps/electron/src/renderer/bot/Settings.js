class Settings {
	#_infiniteRange = false;

	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;
	}

	/**
	 * @returns {void}
	 */
	setInfiniteRange() {
		this.instance.flash.call(window.swf.SetInfiniteRange);
	}

	/**
	 * @returns {void}
	 */
	SetProvokeMonsters() {
		this.instance.flash.call(window.swf.SetProvokeMonsters);
	}

	/**
	 * @returns {void}
	 */
	setEnemyMagnet() {
		this.instance.flash.call(window.swf.SetEnemyMagnet);
	}

	/**
	 * @param {boolean} on
	 */
	setLagKiller(on) {
		this.instance.flash.call(window.swf.SetLagKiller, on ? 'True' : 'False');
	}

	/**
	 * @returns {void}
	 */
	hidePlayers() {
		this.instance.flash.call(window.swf.DestroyPlayers);
	}

	/**
	 * @returns {void}
	 */
	skipCutscenes() {
		this.instance.flash.call(window.swf.SetSkipCutscenes);
	}

	/**
	 * @param {number|string} walkSpeed
	 */
	setWalkSpeed(walkSpeed) {
		this.instance.flash.call(window.swf.SetWalkSpeed, String(walkSpeed));
	}
}
