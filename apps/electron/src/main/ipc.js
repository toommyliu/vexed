const { app, ipcMain: ipc, BrowserWindow, dialog } = require("electron");
const { assignWindowID, createPacketsWindow, getPacketsWindow, getFamilyWindow } = require("./util/createWindow");
const { nanoid } = require("nanoid");
const fs = require("fs-extra");
const { join } = require("path");
const { setIntervalAsync, clearIntervalAsync } = require("set-interval-async/fixed");

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

ipc.on("packets:spam", async function(event, windowID, packets, delay)
{
	let family = getFamilyWindow(windowID);
	if (!family?.game)
	{
		return;
	}

	family.game.webContents.send("packets:spam", packets, delay);
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