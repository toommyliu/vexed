// var { ipcRenderer: ipc } = require("electron");
// var { setIntervalAsync, clearIntervalAsync } = require("set-interval-async");

// let intervalID;
// let idx = 0;

// ipc.on("packets:spam_off", async function()
// {
// 	console.log("packets spam off hit");
// 	if (intervalID)
// 	{
// 		await clearIntervalAsync(intervalID);
// 		intervalID = null;
// 		idx = 0;
// 	}
// });

// ipc.on("packets:spam", function (event, packets, delay)
// {
// 	if (!intervalID)
// 	{
// 		intervalID = setIntervalAsync(function() {
// 			Bot.getInstance().packets.sendServer(packets[idx++]);
// 			if (idx >= packets.length)
// 			{
// 				idx = 0;
// 			}
// 		}, delay);
// 	}
// });