import type { Bot } from './Bot';
import { HouseItem } from './struct/HouseItem';
import type { ItemData } from './struct/Item';

export class House {
	public constructor(public readonly bot: Bot) {}

	/**
	 * Gets house items of the current player.
	 */
	public get items(): HouseItem[] {
		const ret = this.bot.flash.call(() => swf.GetHouseItems());
		return Array.isArray(ret)
			? ret.map((data) => new HouseItem(data as unknown as ItemData))
			: [];
	}

	/**
	 * Gets the total number of house item slots.
	 */
	public get totalSlots(): number {
		return this.bot.flash.call(() => swf.HouseSlots());
	}
}
