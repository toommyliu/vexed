import type { Bot } from '../../api/Bot';

function ct(bot: Bot, packet: JSON) {
	// @ts-expect-error
	if (Array.isArray(packet?.b?.o?.anims)) {
		// @ts-expect-error
		for (let i = 0; i < packet.b.o.anims.length; i++) {
			if (
				// @ts-expect-error
				packet.b.o.anims[i]?.msg
					?.toLowerCase()
					?.includes('prepares a counter attack')
			) {
				bot.combat.cancelTarget();
				bot.combat.cancelAutoAttack();
				bot.combat.pauseAttack = true;
				break;
			}
		}
	}
	// @ts-expect-error
	if (Array.isArray(packet.b.o.a)) {
		// @ts-expect-error
		for (let i = 0; i < packet.b.o.a.length; i++) {
			if (
				// @ts-expect-error
				packet.b.o.a[i]?.cmd === 'aura--' &&
				// @ts-expect-error
				packet.b.o.a[i]?.aura?.nam === 'Counter Attack'
			) {
				// @ts-expect-error
				const monMapID = packet.b.o.a[i]?.tInf.split(':')[1];
				bot.combat.attack(`id:${monMapID}`);
				bot.combat.pauseAttack = false;
				break;
			}
		}
	}
}

export default ct;
