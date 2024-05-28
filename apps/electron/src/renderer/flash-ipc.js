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
			// case "getDrop":
			// 	{
			// 		const data = pkt.b.o;
			// 		if (data.bSuccess === 0) {
			// 			Bot.getInstance().log.info("failed to pickup a drop (?)");
			// 			Bot.getInstance().log.info(data);
			// 			return;
			// 		}

			// 		let out = `Picked up x${data.iQty} "${data.ItemID}" (now at ${data.iQtyNow})`;
			// 		if (data.bBank === 1)
			// 			out += " (added to bank)";
			// 		Bot.getInstance().log.info(out);
			// 	}
			// 	break;
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
			break;
	}
}
