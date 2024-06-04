const { ipcRenderer: ipc } = require("electron");

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

	if (packet.includes("%xt%zm%") && window.id) {
		console.log(`(1) sending packet from ${window.id}: ${packet}`);
		ipc.send("window:game:packetReceived", window.id, packet).catch(() => {});
	}

	if (!window.id) {
		console.log("prevent packet from logging");
	}
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
