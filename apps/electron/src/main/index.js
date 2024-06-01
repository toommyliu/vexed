const fs = require("fs");
const { join } = require("path");
const { app, BrowserWindow, session } = require("electron");

require("./util/setupMenu")();

const userAgent =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36";

function registerFlashPlugin() {
	const flashTrust = require("nw-flash-trust");
	// TODO: add checks for app.isPackaged
	app.commandLine.appendSwitch(
		"ppapi-flash-path",
		join(__dirname, "../../vendor/PepperFlashPlayer.plugin")
	);

	const flashPath = join(
		app.getPath("userData"),
		"Pepper Data",
		"Shockwave Flash",
		"WritableRoot"
	);

	const trustManager = flashTrust.initSync("Vexed", flashPath);
	trustManager.empty();
	trustManager.add(join(__dirname, "../renderer/grimoire.swf"));
}

registerFlashPlugin();

app.once("ready", async () => {
	await fs.promises.mkdir(join(app.getPath("documents"), "Vexed/Scripts"), {
		recursive: true
	});

	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: "",
		webPreferences: {
			enableRemoteModule: true,
			contextIsolation: false,
			nodeIntegration: true,
			plugins: true,
		}
	});

	await window.loadFile(join(__dirname, "../renderer/manager.html"));
	window.webContents.openDevTools({ mode: "right" });

	window.focus();
	window.maximize();
});

app.on("window-all-closed", app.quit);
