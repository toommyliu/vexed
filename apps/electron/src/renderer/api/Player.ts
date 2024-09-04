import Faction from './struct/Faction';
import type Bot from './Bot';

class Player {
	public bot: Bot;

	constructor(bot: Bot) {
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
	public get factions(): Faction[] {
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
	public get className(): string {
		return this.bot.flash.call(swf.Class);
	}

	/**
	 * Gets the state of the current player.
	 * @returns {PlayerState}
	 */
	public get state(): PlayerState {
		return this.bot.flash.call(swf.State);
	}

	/**
	 * Gets the current health of the current player.
	 * @returns {number}
	 */
	public get hp(): number {
		return this.bot.flash.call(swf.Health);
	}

	/**
	 * Gets the maximum health of the current player.
	 * @returns {number}
	 */
	public get maxHP(): number {
		return this.bot.flash.call(swf.HealthMax);
	}

	/**
	 * Checks if the current player is alive.
	 * @returns {boolean}
	 */
	public get alive(): boolean {
		return this.hp > 0;
	}

	/**
	 * Gets the current mana of the current player.
	 * @returns {number}
	 */
	public get mp(): number {
		return this.bot.flash.call(swf.Mana);
	}

	/**
	 * Gets the maximum mana of the current player.
	 * @returns {number}
	 */
	public get maxMP(): number {
		return this.bot.flash.call(swf.ManaMax);
	}

	/**
	 * Gets the level of the current player.
	 * @returns {number}
	 */
	public get level(): number {
		return this.bot.flash.call(swf.Level);
	}

	/**
	 * Gets the gold of the current player.
	 * @returns {number}
	 */
	public get gold(): number {
		return this.bot.flash.call(swf.Gold);
	}

	/**
	 * Whether the current player is AFK.
	 * @returns {boolean}
	 */
	public isAFK(): boolean {
		return this.bot.flash.call(swf.IsAfk);
	}

	/**
	 * Whether the current player has membership.
	 * @returns {boolean}
	 */
	public isMember(): boolean {
		return this.bot.flash.call(swf.IsMember);
	}

	/**
	 * The player's current position.
	 * @returns {[number,number]}
	 */
	public get position(): [number, number] {
		return this.bot.flash.call(swf.Position);
	}

	/**
	 * Walk to a position in the map.
	 * @param {string|number} x The x coordinate to walk to.
	 * @param {string|number} y The y coordinate to walk to.
	 * @returns {void}
	 */
	public walkTo(x: string | number, y: string | number): void {
		this.bot.flash.call(swf.WalkToPoint, String(x), String(y));
	}

	/**
	 * Get the cell of the current player in the map.
	 * @returns {string}
	 */
	public get cell(): string {
		return this.bot.flash.call(swf.Cell);
	}

	/**
	 * Get the pad of the current player in the map.
	 * @returns {string}
	 */
	public get pad(): string {
		return this.bot.flash.call(swf.Pad);
	}

	/**
	 * A check for if the world is fully loaded, aswell as the player's inventory items and art.
	 * @returns {boolean}
	 */
	public isLoaded(): boolean {
		return !!this.bot.flash.call(swf.IsPlayerLoaded);
	}
}

/**
 * Enum representing a player's state.
 * @readonly
 * @enum {number}
 */
enum PlayerState {
	/**
	 * The player is dead.
	 * @memberof PlayerState
	 * @type {number}
	 */
	Dead = 0,
	/**
	 * The player is idle, does not necessarily imply the player is afk.
	 * @memberof PlayerState
	 * @type {number}
	 */
	Idle = 1,
	/**
	 * The player is in combat.
	 * @memberof PlayerState
	 * @type {number}
	 */
	InCombat = 2,
}

Object.defineProperty(window, 'PlayerState', {
	value: PlayerState,
	writable: false,
});

export default Player;
