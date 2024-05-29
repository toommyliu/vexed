/**
 * @param {string[]} packet
 */
function packetFromServer([packet]) {
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
	// console.log(packet);
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
