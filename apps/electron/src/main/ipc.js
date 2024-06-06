const { app, ipcMain: ipc, BrowserWindow, dialog } = require("electron");
const { assignWindowID, createPacketsWindow, getPacketsWindow } = require("./util/createWindow");
const { nanoid } = require("nanoid");
const fs = require("fs-extra");
const { join } = require("path");

const ROOT = join(app.getPath("documents"), "Vexed");

//#region packets
ipc.on("packets:save", async function(_, packets)
{
	try
	{
		await fs.writeFile(join(ROOT, "packets.txt"), packets.join("\n"), { encoding: "utf-8 "});
	} catch
	{
		dialog.showErrorBox("error", "failed to write packets to file.")
	}
});
//#endregion

ipc.handle("window:create:packets", async (_, id) => {
	await createPacketsWindow(id);
});

ipc.on("window:game:generate_id", function(event)
{
	const window = BrowserWindow.fromWebContents(event.sender);
	const windowID = nanoid();
	assignWindowID(window, windowID);

	console.log(`window is now a new parent: ${windowID}`);
});

ipc.on("window:game:packetReceived", (_, id, packet) => {
	const pkt = packet.substring(packet.lastIndexOf(" ") + 1); // remove [sending xyz]
	getPacketsWindow(id)?.webContents.send("packet", pkt);
});