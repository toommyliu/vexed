import type { Bot } from './Bot';
import { Faction, type FactionData } from './struct/Faction';

export class Player {
	public constructor(public readonly bot: Bot) {}

	/**
	 * The player's faction data.
	 */
	public get factions(): Faction[] {
		const ret = this.bot.flash.call<FactionData[]>(() => swf.GetFactions());
		return Array.isArray(ret) ? ret.map((data) => new Faction(data)) : [];
	}

	/**
	 * The name of the player's equipped class.
	 */
	public get className(): string {
		return this.bot.flash.call(() => swf.Class());
	}

	/**
	 * The state of the player.
	 */
	public get state(): PlayerState {
		return this.bot.flash.call(() => swf.State());
	}

	/**
	 * The health of the player.
	 */
	public get hp(): number {
		return this.bot.flash.call(() => swf.Health());
	}

	/**
	 * The maximum health of the player.
	 */
	public get maxHp(): number {
		return this.bot.flash.call(() => swf.HealthMax());
	}

	/**
	 * Whether the player is alive.
	 */
	public get alive(): boolean {
		return this.hp > 0;
	}

	/**
	 * The mana of the player.
	 */
	public get mp(): number {
		return this.bot.flash.call(() => swf.Mana());
	}

	/**
	 * The maximum mana of the player.
	 */
	public get maxMp(): number {
		return this.bot.flash.call(() => swf.ManaMax());
	}

	/**
	 * The level of the player.
	 */
	public get level(): number {
		return this.bot.flash.call(() => swf.Level());
	}

	/**
	 * The player's gold.
	 */
	public get gold(): number {
		return this.bot.flash.call(() => swf.Gold());
	}

	/**
	 * Whether the player is AFK.
	 */
	public isAFK(): boolean {
		return this.bot.flash.call(() => swf.IsAfk());
	}

	/**
	 * Whether the player has an active membership.
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
	 * Walks to a position on the map.
	 *
	 * @param x - The x coordinate to walk to.
	 * @param y - The y coordinate to walk to.
	 */
	public walkTo(x: number | string, y: number | string): void {
		this.bot.flash.call(() => swf.WalkToPoint(String(x), String(y)));
	}

	/**
	 * The cell the player is in, in the map.
	 */
	public get cell(): string {
		return this.bot.flash.call(() => swf.Cell());
	}

	/**
	 * The pad the player is in, in the map.
	 */
	public get pad(): string {
		return this.bot.flash.call(() => swf.Pad());
	}

	/**
	 * Whether the player has fully loaded in.
	 */
	public isLoaded(): boolean {
		return Boolean(
			this.bot.flash.call<boolean>(() => swf.IsPlayerLoaded()),
		);
	}

	/**
	 * Comprehensive check to determine if the player is ready.
	 *
	 * @remarks
	 * This checks if the player is logged in, the world has loaded, and the player has fully loaded in.
	 */
	public isReady(): boolean {
		return (
			this.bot.auth.isLoggedIn() &&
			!this.bot.world.isLoading() &&
			this.isLoaded()
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
