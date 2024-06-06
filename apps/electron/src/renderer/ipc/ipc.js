var { ipcRenderer: ipc } = require("electron");
var { setIntervalAsync, clearIntervalAsync } = require("set-interval-async");

let intervalID;
let idx = 0;

ipc.on("packets:spam", function (event, packets, delay)
{
	if (!intervalID)
	{
		intervalID = setIntervalAsync(function() {
			console.log(`sending ${packets[idx++]}`);
			// Bot.getInstance().packets.sendServer(packets[idx++]);
			if (idx >= packets.length)
			{
				ipc.send()
				console.log(`sent all packets, doing it again`);
				idx = 0;
			}
			console.log('finished');
		}, delay);
	}
});