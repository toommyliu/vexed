import type Bot from '../../api/Bot';

/**
 * @param {import('../../botting/api/Bot')} bot
 * @param {JSON} packet
 */
async function addGoldExp(bot: Bot, packet: JSON) {
	// m = monster
	// q = quest

	// @ts-expect-error
	if (packet.b.o.typ === 'm') {
		const getMonsters = () => bot.world.availableMonsters;
		// @ts-expect-error
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
