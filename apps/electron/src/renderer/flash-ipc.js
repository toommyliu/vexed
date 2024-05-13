function packetFromServer([packet]) {
	if (packet.startsWith('{"')) {
		const pkt = JSON.parse(packet);

		switch (pkt.b.o.cmd) {
			case 'dropItem':
				{
					/**
					 * @type {BankItemData}
					 */
					const item = Object.values(pkt.b.o.items)[0];
					Bot.getInstance().world.dropStack.add(item);
				}
				break;
		}
	}
}
