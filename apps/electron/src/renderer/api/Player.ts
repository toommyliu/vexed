import type { Bot } from './Bot';
import { Faction, type FactionData } from './struct/Faction';

export class Player {
	public constructor(public readonly bot: Bot) {}

	/**
	 * Get the player's factions data.
	 */
	public get factions(): Faction[] {
		const ret = this.bot.flash.call<FactionData[]>(() => swf.GetFactions());
		return Array.isArray(ret) ? ret.map((data) => new Faction(data)) : [];
	}

	/**
	 * Gets the name of the player's equipped class.
	 */
	public get className(): string {
		return this.bot.flash.call(() => swf.Class());
	}

	/**
	 * Gets the state of the current player.
	 */
	public get state(): PlayerState {
		return this.bot.flash.call(() => swf.State());
	}

	/**
	 * Gets the current health of the current player.
	 */
	public get hp(): number {
		return this.bot.flash.call(() => swf.Health());
	}

	/**
	 * Gets the maximum health of the current player.
	 */
	public get maxHP(): number {
		return this.bot.flash.call(() => swf.HealthMax());
	}

	/**
	 * Checks if the current player is alive.
	 */
	public get alive(): boolean {
		return this.hp > 0;
	}

	/**
	 * Gets the current mana of the current player.
	 */
	public get mp(): number {
		return this.bot.flash.call(() => swf.Mana());
	}

	/**
	 * Gets the maximum mana of the current player.
	 */
	public get maxMP(): number {
		return this.bot.flash.call(() => swf.ManaMax());
	}

	/**
	 * Gets the level of the current player.
	 */
	public get level(): number {
		return this.bot.flash.call(() => swf.Level());
	}

	/**
	 * Gets the gold of the current player.
	 */
	public get gold(): number {
		return this.bot.flash.call(() => swf.Gold());
	}

	/**
	 * Whether the current player is AFK.
	 */
	public isAFK(): boolean {
		return this.bot.flash.call(() => swf.IsAfk());
	}

	/**
	 * Whether the current player has membership.
	 */
	public isMember(): boolean {
		return this.bot.flash.call(() => swf.IsMember());
	}

	/**
	 * The player's current position.
	 */
	public get position(): [number, number] {
		return this.bot.flash.call(() => swf.Position());
	}

	/**
	 * Walk to a position in the map.
	 *
	 * @param x - The x coordinate to walk to.
	 * @param y - The y coordinate to walk to.
	 */
	public walkTo(x: number | string, y: number | string): void {
		this.bot.flash.call(() => swf.WalkToPoint(String(x), String(y)));
	}

	/**
	 * Get the cell of our player in the map.
	 */
	public get cell(): string {
		return this.bot.flash.call(() => swf.Cell());
	}

	/**
	 * Get the pad of the our player in the map.
	 */
	public get pad(): string {
		return this.bot.flash.call(() => swf.Pad());
	}

	/**
	 * A check for if the world is fully loaded, aswell as the player's inventory items and art.
	 */
	public isLoaded(): boolean {
		return Boolean(
			this.bot.flash.call<boolean>(() => swf.IsPlayerLoaded()),
		);
	}

	/**
	 * Shorthand for checking if the player is logged in, the world is loaded, and the player is fully loaded.
	 */
	public isReady(): boolean {
		return (
			this.bot.auth.loggedIn && !this.bot.world.isLoading() && this.isLoaded()
		);
	}
}

/**
 * Enum representing a player's state.
 */
export enum PlayerState {
	/**
	 * The player is dead.
	 */
	Dead = 0,
	/**
	 * The player is idle, does not necessarily imply the player is afk.
	 */
	Idle = 1,
	/**
	 * The player is in combat.
	 */
	InCombat = 2,
}

Object.defineProperty(window, 'PlayerState', {
	value: PlayerState,
	writable: false,
});
