/**
 * @param {import('../../botting/api/Bot')} bot
 * @param {JSON} packet
 */
function ct(bot, packet) {
	// prettier-ignore
	if (packet.b.o?.anims?.[0]?.msg?.toLowerCase()?.includes('prepares a counter attack')) {
		bot.combat.cancelTarget();
		bot.combat.cancelAutoAttack();
		bot.combat.pauseAttack = true;
	}

	if (Array.isArray(packet.b.o.a)) {
		for (let i = 0; i < packet.b.o.a.length; i++) {
			if (
				packet.b.o.a[i]?.cmd === 'aura--' &&
				packet.b.o.a[i]?.aura?.nam === 'Counter Attack'
			) {
				const monMapID = packet.b.o.a[i]?.tInf.split(':')[1];
				bot.combat.attack(`id:${monMapID}`);
				bot.combat.pauseAttack = false;
				break;
			}
		}
	}
}

module.exports = ct;
