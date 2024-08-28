// TODO
/**
 * @param {import('../../botting/api/Bot')} bot
 * @param {JSON} packet
 */
async function addGoldExp(bot, packet) {
	// m = monster
	// q = quest
	if (packet.b.o.typ === 'm') {
		const getMonsters = () => bot.world.availableMonsters;
		const monMapID = packet.b.o.id;

		await bot.waitUntil(() =>
			getMonsters().find((m) => m.monMapID === monMapID),
		);

		bot.emit(
			'monsterDeath',
			getMonsters().find((m) => m.monMapID === monMapID),
		);
	}
}

export default addGoldExp;