var { ipcRenderer: ipc } = require('electron');

/**
 * @param {string[]} packet
 */
function packetFromServer([packet]) {
	const bot = Bot.getInstance();
	bot.flash.emit('packetFromServer', packet);

	if (packet.startsWith('{"')) {
		const pkt = JSON.parse(packet);

		switch (pkt.b.o.cmd) {
			case 'dropItem':
				{
					const item = Object.values(pkt.b.o.items)[0];
					Bot.getInstance().drops.addToStack(item);
				}
				break;
			case 'ct':
				{
					if (
						pkt.b.o?.anims?.[0]?.msg?.includes(
							'prepares a counter attack',
						)
					) {
						combat.cancelAttack();
						combat.cancelTarget();
						combat.pauseAttack = true;
					}

					if (Array.isArray(pkt.b.o.a)) {
						for (let i = 0; i < pkt.b.o.a.length; i++) {
							if (
								pkt.b.o.a[i]?.cmd === 'aura--' &&
								pkt.b.o.a[i]?.aura?.nam === 'Counter Attack'
							) {
								combat.pauseAttack = false;
								break;
							}
						}
					}
				}
				break;
		}
	}
}

function packetFromClient([packet]) {
	Bot.getInstance().flash.emit('packetFromClient', packet);

	if (packet.includes('%xt%zm%') && !windows.packets.closed) {
		windows?.packets?.postMessage({ event: 'game:packet_sent', packet });
	}
}

function connection([state]) {
	if (state === 'OnConnection') {
		$('#cells').removeAttr('disabled');
		$('#pads').removeAttr('disabled');
	} else if (state === 'OnConnectionLost') {
		$('#cells').attr('disabled', true);
		$('#pads').attr('disabled', true);

		Bot.getInstance().drops.reset();
	}
}
