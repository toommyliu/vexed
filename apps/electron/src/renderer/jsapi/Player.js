/**
 * Represents the local player.
 */
class Player {
	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		this.bot = bot;
	}

	/**
	 * Get the player's factions data.
	 * @returns {Faction[]}
	 */
	get factions() {
		return (
			this.bot.flash
				.call(window.swf.GetFactions)
				?.map((data) => new Faction(data)) ?? []
		);
	}

	/**
	 * Gets the name of the player's equipped class.
	 * @returns {string}
	 */
	get className() {
		return this.bot.flash.call(window.swf.Class);
	}

	/**
	 * Gets the state of the current player.
	 * @returns {number}
	 */
	get state() {
		return this.bot.flash.call(window.swf.State);
	}

	/**
	 * Gets the current health of the current player.
	 * @returns {number}
	 */
	get hp() {
		return this.bot.flash.call(window.swf.Health);
	}

	/**
	 * Gets the maximum health of the current player.
	 * @returns {number}
	 */
	get maxHp() {
		return this.bot.flash.call(window.swf.HealthMax);
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
		return this.bot.flash.call(window.swf.Mana);
	}

	/**
	 * Gets the maximum mana of the current player.
	 * @returns {number}
	 */
	get maxMp() {
		return this.bot.flash.call(window.swf.ManaMax);
	}

	/**
	 * Gets the level of the current player.
	 * @returns {number}
	 */
	get level() {
		return this.bot.flash.call(window.swf.Level);
	}

	/**
	 * Gets the gold of the current player.
	 * @returns {number}
	 */
	get gold() {
		return this.bot.flash.call(window.swf.Gold);
	}

	/**
	 * Checks if the current player is AFK.
	 * @returns {boolean}
	 */
	get isAfk() {
		return this.bot.flash.call(window.swf.IsAfk);
	}

	/**
	 * Checks if the current player has membership.
	 * @returns {boolean}
	 */
	get isMember() {
		return this.bot.flash.call(window.swf.IsMember);
	}

	/**
	 * The X position of the current player
	 * @returns {number}
	 */
	get xPos() {
		return this.bot.flash.call(window.swf.Position)?.[0];
	}

	/**
	 * The Y position of the current player
	 * @returns {number}
	 */
	get yPos() {
		return this.bot.flash.call(window.swf.Position)?.[1];
	}

	/**
	 * Walk to a position in the map.
	 * @param {number} x
	 * @param {number} y
	 * @returns {void}
	 */
	walkTo(x, y) {
		this.bot.flash.call(window.swf.WalkToPoint, x, y);
	}

	/**
	 * Get the cell of the current player in the map.
	 * @returns {string}
	 */
	get cell() {
		return this.bot.flash.call(window.swf.Cell);
	}

	/**
	 * Get the pad of the current player in the map.
	 * @returns {string}
	 */
	get pad() {
		return this.bot.flash.call(window.swf.Pad);
	}
}

/**
 * Enum representing a player's state.
 * @readonly
 * @enum {number}
 */
const PlayerState = Object.freeze({
	Dead: 0,
	Idle: 1,
	InCombat: 2
});
