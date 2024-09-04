import HouseItem from './struct/HouseItem';
import type Bot from './Bot';

class House {
	public bot: Bot;

	constructor(bot: Bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Gets house items of the current player.
	 * @returns {HouseItem[]}
	 */
	public get items(): HouseItem[] {
		const ret = this.bot.flash.call(window.swf.GetHouseItems);
		if (Array.isArray(ret)) {
			return ret.map((data) => new HouseItem(data));
		}
		return [];
	}

	/**
	 * Gets the total number of house item slots.
	 * @returns {number}
	 */
	public get totalSlots(): number {
		return this.bot.flash.call(window.swf.HouseSlots);
	}
}

export default House;
