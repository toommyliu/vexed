const { app, ipcMain: ipc, BrowserWindow, dialog } = require("electron");
const { assignWindowID } = require("./windows");
const { nanoid } = require("nanoid");

const fs = require("fs-extra");
const { join } = require("path");

const ROOT = join(app.getPath("documents"), "Vexed");

ipc.on("game:generate_id", function (event)
{
	const window = BrowserWindow.fromWebContents(event.sender);
	const windowID = nanoid();
	assignWindowID(window, windowID);
});

ipc.on("packets:save", async function (event, packets)
{
	try
	{
		await fs.writeFile(join(ROOT, "packets.txt"), packets.join("\n"), { encoding: "utf-8" });
	} catch
	{
		dialog.showErrorBox("error", "failed to write packets to file.")
	}
});