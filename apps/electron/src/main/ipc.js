const { app, ipcMain: ipc, BrowserWindow, dialog } = require("electron");
const { assignWindowID, createPacketsWindow, createScriptsWindow, createToolsWindow, getChildWindow } = require("./windows");
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

//#region window creation
ipc.handle("game:create_scripts", async function (event, windowID)
{
	await createScriptsWindow(windowID);
});

ipc.handle("game:create_tools", async function(event, windowID)
{
	await createToolsWindow(windowID);
});

ipc.handle("window:create:packets", async (_, id) => {
	await createPacketsWindow(id);
});

ipc.on("window:game:generate_id", function(event)
{
	const window = BrowserWindow.fromWebContents(event.sender);
	const windowID = nanoid();
	assignWindowID(window, windowID);
});
//#endregion

ipc.on("game:packet_sent", (event, windowID, packet) => {
	const pkt = packet.substring(packet.lastIndexOf(" ") + 1);
	getChildWindow(windowID, "packets")?.webContents.send("packet", pkt);
});