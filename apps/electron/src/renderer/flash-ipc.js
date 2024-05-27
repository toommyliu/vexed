function packetFromServer([packet]) {
	if (packet.startsWith('{"')) {
		const pkt = JSON.parse(packet);

		// console.log(pkt);

		switch (pkt.b.o.cmd) {
			case "dropItem":
				{
					const item = Object.values(pkt.b.o.items)[0];
					Bot.getInstance().drops.addToStack(item);
				}
				break;
		}
	}
}

function packetFromClient([packet]) {
	// console.log(packet);
}

function connection([state]) {
	const bot = Bot.getInstance();
	switch (state) {
		case "OnConnection":
			break;
		case "OnConnectionLost":
			break;
	}
}
