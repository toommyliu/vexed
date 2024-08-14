/**
 * @param {import('../../botting/api/Bot')} bot
 * @param {JSON} packet
 */
function dropItem(bot, packet) {
	const items = packet.b.o.items;
	for (const itemData of Object.values(items)) {
		bot.drops.addDrop(itemData);
	}
}

module.exports = dropItem;
