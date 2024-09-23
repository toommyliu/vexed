import type { Bot } from './Bot';
import { HouseItem } from './struct/HouseItem';
import type { ItemData } from './struct/Item';

export class House {
	public constructor(public bot: Bot) {}

	/**
	 * Gets house items of the current player.
	 */
	public get items(): HouseItem[] {
		const ret = this.bot.flash.call(() => swf.GetHouseItems());
		if (Array.isArray(ret)) {
			return ret.map(
				(data) => new HouseItem(data as unknown as ItemData),
			);
		}

		return [];
	}

	/**
	 * Gets the total number of house item slots.
	 */
	public get totalSlots(): number {
		return this.bot.flash.call(() => swf.HouseSlots());
	}
}
