/**
 * @param {string[]} packet
 */
function packetFromServer([packet]) {
	const bot = Bot.getInstance();
	bot.flash.emit("packetFromServer", packet);

	if (packet.startsWith('{"')) {
		const pkt = JSON.parse(packet);

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
	Bot.getInstance().flash.emit("packetFromClient", packet);
}

function connection([state]) {
	switch (state) {
		case "OnConnection":
			break;
		case "OnConnectionLost":
			{
				Bot.getInstance().drops.reset();
			}
			break;
	}
}
