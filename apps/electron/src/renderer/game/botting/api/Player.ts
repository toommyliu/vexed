import Faction from './struct/Faction';

class Player {
	constructor(bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Get the player's factions data.
	 * @returns {Faction[]}
	 */
	get factions() {
		const ret = this.bot.flash.call(swf.GetFactions);
		if (Array.isArray(ret)) {
			return ret.map((data) => new Faction(data));
		}
		return [];
	}

	/**
	 * Gets the name of the player's equipped class.
	 * @returns {string}
	 */
	get className() {
		return this.bot.flash.call(swf.Class);
	}

	/**
	 * Gets the state of the current player.
	 * @returns {PlayerState}
	 */
	get state() {
		return this.bot.flash.call(swf.State);
	}

	/**
	 * Gets the current health of the current player.
	 * @returns {number}
	 */
	get hp() {
		return this.bot.flash.call(swf.Health);
	}

	/**
	 * Gets the maximum health of the current player.
	 * @returns {number}
	 */
	get maxHP() {
		return this.bot.flash.call(swf.HealthMax);
	}

	/**
	 * Checks if the current player is alive.
	 * @returns {boolean}
	 */
	get alive() {
		return this.hp > 0;
	}

	/**
	 * Gets the current mana of the current player.
	 * @returns {number}
	 */
	get mp() {
		return this.bot.flash.call(swf.Mana);
	}

	/**
	 * Gets the maximum mana of the current player.
	 * @returns {number}
	 */
	get maxMP() {
		return this.bot.flash.call(swf.ManaMax);
	}

	/**
	 * Gets the level of the current player.
	 * @returns {number}
	 */
	get level() {
		return this.bot.flash.call(swf.Level);
	}

	/**
	 * Gets the gold of the current player.
	 * @returns {number}
	 */
	get gold() {
		return this.bot.flash.call(swf.Gold);
	}

	/**
	 * Checks if the current player is AFK.
	 * @returns {boolean}
	 */
	get afk() {
		return this.bot.flash.call(swf.IsAfk);
	}

	/**
	 * Whether the current player has membership.
	 * @returns {boolean}
	 */
	isMember() {
		return this.bot.flash.call(swf.IsMember);
	}

	/**
	 * The player's current position.
	 * @returns {{ x: number, y: number }}
	 */
	get position() {
		return this.bot.flash.call(swf.Position);
	}

	/**
	 * Walk to a position in the map.
	 * @param {string|number} x The x coordinate to walk to.
	 * @param {string|number} y The y coordinate to walk to.
	 * @returns {void}
	 */
	walkTo(x, y) {
		this.bot.flash.call(swf.WalkToPoint, x, y);
	}

	/**
	 * Get the cell of the current player in the map.
	 * @returns {string}
	 */
	get cell() {
		return this.bot.flash.call(swf.Cell);
	}

	/**
	 * Get the pad of the current player in the map.
	 * @returns {string}
	 */
	get pad() {
		return this.bot.flash.call(swf.Pad);
	}

	/**
	 * A check for if the world is fully loaded, aswell as the player's inventory items and art.
	 * @returns {boolean}
	 */
	get loaded() {
		return !!this.bot.flash.call(swf.IsPlayerLoaded);
	}
}

/**
 * Enum representing a player's state.
 * @readonly
 * @enum {number}
 */
const PlayerState = Object.freeze({
	/**
	 * The player is dead.
	 * @memberof PlayerState
	 * @type {number}
	 */
	Dead: 0,
	/**
	 * The player is idle, does not necessarily imply the player is afk.
	 * @memberof PlayerState
	 * @type {number}
	 */
	Idle: 1,
	/**
	 * The player is in combat.
	 * @memberof PlayerState
	 * @type {number}
	 */
	InCombat: 2,
});

Object.defineProperty(window, 'PlayerState', {
	value: PlayerState,
	writable: false,
});

export default Player;
