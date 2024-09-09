import type { Bot } from '../../api/Bot';
import type { ItemData } from '../../api/struct/Item';

function dropItem(bot: Bot, packet: JSON) {
	// @ts-expect-error
	const items = packet.b.o.items;
	for (const itemData of Object.values(items)) {
		bot.drops.addDrop(itemData as unknown as ItemData);
	}
}

export default dropItem;
