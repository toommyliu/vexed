const fs = require("fs-extra");
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
	const base = join(app.getPath("documents"), "Vexed");
	const preferencesPath = join(base, "preferences.json");

	await fs.ensureDir(join(base, "Scripts"));
	await fs.ensureFile(preferencesPath);

	const preferences = await fs.readJSON(preferencesPath).catch(async () => {
		const def = { launch: "manager" };
		await fs.writeJSON(preferencesPath, def, { spaces: 4 });
		return def;
	});

	if (!("launch" in preferences)) {
		await createMainWindow();
		return;
	}

	if (preferences.launch.toLowerCase() === "game") {
		await createGameWindow();
	} else {
		await createMainWindow();
	}
});

app.on("window-all-closed", app.quit);
