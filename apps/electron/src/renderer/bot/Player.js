class Player {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		this.instance = instance;
	}

	/**
	 * @returns {Faction[]}
	 */
	get factions() {
		return this.instance.flash.call(window.swf.GetFactions);
	}

	/**
	 * @returns {string}
	 */
	get className() {
		return this.instance.flash.call(window.swf.Class);
	}

	/**
	 * 0 = dead
	 * 1 = idle
	 * 2 = in combat
	 * @returns {number}
	 */
	get state() {
		return this.instance.flash.call(window.swf.State);
	}

	/**
	 * @returns {number}
	 */
	get hp() {
		return this.instance.flash.call(window.swf.Health);
	}

	/**
	 * @returns {number}
	 */
	get maxHp() {
		return this.instance.flash.call(window.swf.HealthMax);
	}

	/**
	 * @returns {boolean}
	 */
	get alive() {
		return this.hp > 0;
	}

	/**
	 * @returns {number}
	 */
	get mp() {
		return this.instance.flash.call(window.swf.Mana);
	}

	/**
	 * @returns {number}
	 */
	get maxMp() {
		return this.instance.flash.call(window.swf.ManaMax);
	}

	/**
	 * @returns {number}
	 */
	get level() {
		return this.instance.flash.call(window.swf.Level);
	}

	/**
	 * @returns {number}
	 */
	get gold() {
		return this.instance.flash.call(window.swf.Gold);
	}

	/**
	 * @returns {boolean}
	 */
	get isAfk() {
		return this.instance.flash.call(window.swf.IsAfk);
	}

	/**
	 * @returns {boolean}
	 */
	get isMember() {
		return this.instance.flash.call(window.swf.IsMember);
	}

	/**
	 * @returns {[number, number]}
	 */
	get position() {
		return this.instance.flash.call(window.swf.Position);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {void}
	 */
	walkTo(x, y) {
		this.instance.flash.call(window.swf.WalkToPoint, x, y);
	}

	/**
	 * @returns {string}
	 */
	get cell() {
		return this.instance.flash.call(window.swf.Cell);
	}

	/**
	 * @returns {string}
	 */
	get pad() {
		return this.instance.flash.call(window.swf.Pad);
	}
}

/**
 * @typedef {Object} Faction
 * @property {string} CharFactionID
 * @property {string} FactionID
 * @property {number} iRank The rank that the player has achieved in this faction
 * @property {number} iRep The total amount of rep the player has for this faction
 * @property {number} iRepToRank The total required rep for the player to rank up
 * @property {number} iSpillRep The amount of rep the player has for their current rank
 * @property {string} sName The name of the faction
 */
