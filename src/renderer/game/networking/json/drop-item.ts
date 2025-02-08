import type { Bot } from '../../lib/Bot';
import type { ItemData } from '../../lib/models/Item';

export function dropItem(bot: Bot, packet: DropItemPacket) {
	const items = packet.b.o.items;
	for (const itemData of Object.values(items)) {
		bot.drops.addDrop(itemData);
	}
}

export type DropItemPacket = {
	b: {
		o: {
			cmd: 'dropItem';
			/**
			 * Mapping of item id and item data.
			 */
			items: Record<number, ItemData>;
		};
		/**
		 * Always -1?
		 */
		r: number;
	};
	t: 'xt';
};
