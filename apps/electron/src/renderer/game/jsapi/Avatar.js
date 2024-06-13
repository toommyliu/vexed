/**
 * A remote player.
 */
class Avatar {
	constructor(data) {
		/**
		 * @type {PlayerData}
		 */
		this.data = data;
	}

	/**
	 * The name of the player.
	 * @returns {string}
	 */
	get name() {
		return this.data.uoName;
	}

	/**
	 * The current HP of the player.
	 * @returns {number}
	 */
	get hp() {
		return this.data.intHP;
	}

	/**
	 * The max HP of the player.
	 * @returns {number}
	 */
	get maxHp() {
		return this.data.intHPMax;
	}

	/**
	 * The current MP of the player.
	 * @returns {number}
	 */
	get mp() {
		return this.data.intMP;
	}

	/**
	 * The max MP of the player.
	 * @returns {number}
	 */
	get maxMp() {
		return this.data.intMPMax;
	}

	/**
	 * The player's stats.
	 * @returns {Object}
	 */
	get stats() {
		return {
			haste: this.data.sta.$tha,
			strength: this.data.sta.$STR,
			wisdom: this.data.sta.$WIS,
			dexterity: this.data.sta.$DEX,
			endurance: this.data.sta.$END,
			intellect: this.data.sta.$INT,
			luck: this.data.sta.$LCK,
			attackPower: this.data.sta.$ap,
			spellPower: this.data.sta.$sp,
			criticalChance: this.data.sta.$tcr,
			criticalMultiplier: this.data.sta.$scm,
			evasionChance: this.data.sta.$tdo,
		};
	}

	/**
	 * Whether the player is AFK.
	 * @returns {boolean}
	 */
	get isAfk() {
		return this.data.afk;
	}

	/**
	 * The entity ID of the player.
	 * @returns {number}
	 */
	get id() {
		return this.data.entID;
	}

	/**
	 * The player's level.
	 * @returns {number}
	 */
	get level() {
		return this.data.intLevel;
	}

	/**
	 * The player's current cell.
	 * @returns {string}
	 */
	get cell() {
		return this.data.strFrame;
	}

	/**
	 * The player's current pad.
	 */
	get pad() {
		return this.data.strPad;
	}

	/**
	 * The X position of this player
	 * @returns {number}
	 */
	get xPos() {
		return this.data.tx;
	}

	/**
	 * The Y position of this player
	 * @returns {number}
	 */
	get yPos() {
		return this.data.ty;
	}

	/**
	 * The player's state.
	 * @returns {PlayerState}
	 */
	get state() {
		return this.data.intState;
	}
}

/**
 * @typedef {Object} PlayerData
 * @property {any[]} auras
 * @property {number} intMP
 * @property {number} entID
 * @property {boolean} afk
 * @property {number} tx
 * @property {string} uoName
 * @property {string} entType
 * @property {string} strPad
 * @property {Object.<string, any>} targets
 * @property {number} ty
 * @property {number} intLevel
 * @property {boolean} showHelm
 * @property {number} intMPMax
 * @property {number} intState
 * @property {number} intSP
 * @property {string} strUsername
 * @property {number} intHP
 * @property {boolean} showCloak
 * @property {string} strFrame
 * @property {number} intHPMax
 */
