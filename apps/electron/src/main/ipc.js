const { ipcMain } = require("electron");
const { createPacketsWindow, getPacketsWindow } = require("./util/createWindow");

ipcMain.handle("window:create:packets", async (_, id) => {
	await createPacketsWindow(id);
});

ipcMain.on("window:game:packetReceived", (_, id, packet) => {
	const pkt = packet.substring(packet.lastIndexOf(" ") + 1); // remove [sending xyz]
	console.log(`(2) sending packet from ${id}: ${pkt}`);
	getPacketsWindow(id).webContents.send("packet", pkt);
});