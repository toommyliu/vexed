const fs = require("fs");
const { join } = require("path");
const { app } = require("electron");

const { createMainWindow, createGameWindow } = require("./util/createWindow");

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

	// whether to immediately launch into a game window
	const skip = await fs.promises.stat(join(app.getPath("documents"), "Vexed/game.txt")).catch(() => null);
	if (!skip?.isFile()) {
		await createMainWindow();
	} else {
		await createGameWindow();
	}
});

app.on("window-all-closed", app.quit);
