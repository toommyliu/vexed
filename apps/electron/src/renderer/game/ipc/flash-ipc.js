var { ipcRenderer: ipc } = require("electron");

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

	if (packet.includes("%xt%zm%")) {
		ipc.send("game:packet_sent", window.id, packet);
	}
}

function connection([state]) {
	if (state === "OnConnection")
	{
		$("#cells").removeAttr("disabled");
		$("#pads").removeAttr("disabled");
	}
	else if (state === "OnConnectionLost")
	{
		$("#cells").attr("disabled", true);
		$("#pads").attr("disabled", true);

		Bot.getInstance().drops.reset();
	}
}
