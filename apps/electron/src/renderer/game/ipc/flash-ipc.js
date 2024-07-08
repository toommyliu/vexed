/**
 * @param {string[]} packet
 */
function packetFromServer([packet]) {
	if (packet.startsWith('%xt%')) {
		const args = packet.split('%');

		const cmd = args[2];

		switch (cmd.toLowerCase()) {
			case 'uotls':
				{
					if (maid.player && maid.copyWalk) {
						if (maid.player !== args[4].toLowerCase()) {
							return;
						}

						const data = args[5].split(',');

						const x = Number.parseInt(data[1].split(':')[1], 10);
						const y = Number.parseInt(data[2].split(':')[1], 10);

						window.swf.WalkToPoint(x, y);
					}
				}
				break;
		}
	}

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

async function packetFromClient([packet]) {
	if (packet.includes('%xt%zm%')) {
		if (!windows?.packetsLogger?.closed) {
			windows?.packetsLogger?.postMessage({
				event: 'game:packet_sent',
				packet,
			});
		}

		if (
			packet.includes('retrieveUserData') ||
			packet.includes('retrieveUserDatas')
		) {
			if ($('#option-hide-players').attr('data-checked') === 'true') {
				await bot.waitUntil(
					() => !world.loading && inventory.items.length > 0,
				);
				settings.hidePlayers();
			}
		}
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
