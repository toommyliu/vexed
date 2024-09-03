import type Bot from '../../api/Bot';

/**
 * @param {import('../../botting/api/Bot')} bot
 * @param {JSON} packet
 */
function dropItem(bot: Bot, packet: JSON) {
	// @ts-expect-error
	const items = packet.b.o.items;
	for (const itemData of Object.values(items)) {
		bot.drops.addDrop(itemData);
	}
}

export default dropItem;
