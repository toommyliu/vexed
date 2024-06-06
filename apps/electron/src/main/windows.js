const { join } = require("path");
const { BrowserWindow, session } = require("electron");
const { nanoid } = require("nanoid");

const RENDERER = join(__dirname, "../renderer");

// The account manager window (limit: 1)
let managerWindow = null;

const windows = new Map();

const userAgent =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36";

async function createManager() {
	if (managerWindow)
	{
		managerWindow.focus();
		return;
	}

	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: "Account Manager",
		webPreferences: {
			enableRemoteModule: true,
			contextIsolation: false,
			nodeIntegration: true,
		}
	});

	window.on("closed", function()
	{
		managerWindow = null;
	});

	await window.loadFile(join(RENDERER, "manager/manager.html"));
	managerWindow = window;
}

async function createGame(account = null) {
	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: account?.username ?? "",
		webPreferences: {
			enableRemoteModule: true,
			contextIsolation: false,
			nodeIntegration: true,
			plugins: true,
		},
	});

	window.webContents.setUserAgent(userAgent);
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders["User-Agent"] = userAgent;
		details.requestHeaders.artixmode = "launcher";
		callback({ requestHeaders: details.requestHeaders, cancel: false });
	});

	await window.loadFile(join(RENDERER, "game/game.html"));
	window.webContents.openDevTools({ mode: "right" });
	window.maximize();

	const windowID = nanoid();
	assignWindowID(window, windowID);

	console.log(`Created a family with windowID: ${windowID}`);

	if (account) {
		window.webContents.executeJavaScript(`window.account=${JSON.stringify(account)}`);
	}

	window.on("closed", function()
	{
		if (!windows.has(windowID))
		{
			return;
		}

		const wnd = windows.get(windowID);

		for (const [k, v] of Object.entries(wnd))
		{
			try
			{
				v?.close();
				k = null;
			} catch {}
		}

		windows.delete(windowID);
	});
}

function assignWindowID(window, windowID)
{
	windows.set(windowID, {
		game: window,
		scripts: null,
		tools: null,
		packets: null
	});

	window.webContents.send("generate-id", windowID);
}

async function createScriptsWindow(windowID)
{
	const wnd = windows.get(windowID);

	if (wnd?.scripts) {
		console.log(`Blocked scripts window creation for: ${windowID}`)
		wnd?.packets.focus();
		return;
	}

	console.log(`Creating child (scripts) with windowID: ${windowID}`);

	const window = new BrowserWindow({
		title: "Scripts",
		width: 451,
		height: 370,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
		},
	});

	window.on("closed", () => {
		wnd.scripts = null;
	});

	await window.loadFile(join(RENDERER, "game/pages/scripts.html"));
	window.webContents.executeJavaScript(`window.id = "${windowID}"`);
	window.webContents.openDevTools({ mode: "right" });
	wnd.scripts = window;
}

async function createToolsWindow(windowID)
{
	const wnd = windows.get(windowID);

	if (wnd?.tools) {
		console.log(`Blocked tools window creation for: ${windowID}`)
		wnd?.packets.focus();
		return;
	}

	console.log(`Creating child (tools) with windowID: ${windowID}`);

	const window = new BrowserWindow({
		title: "Tools",
		width: 451,
		height: 370,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
		},
	});

	window.on("closed", () => {
		wnd.tools = null;
	});

	await window.loadFile(join(RENDERER, "game/pages/tools.html"));
	window.webContents.executeJavaScript(`window.id = "${windowID}"`);
	window.webContents.openDevTools({ mode: "right" });
	wnd.tools = window;
}

async function createPacketsWindow(windowID) {
	const wnd = windows.get(windowID);

	if (wnd?.packets) {
		console.log(`Blocked packets window creation for: ${windowID}`)
		wnd?.packets.focus();
		return;
	}

	console.log(`Creating child (packets) with windowID: ${windowID}`);

	const window = new BrowserWindow({
		title: "Packets",
		width: 451,
		height: 370,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
		},
	});

	window.on("closed", () => {
		wnd.packets = null;
	});

	await window.loadFile(join(RENDERER, "game/pages/packets.html"));
	window.webContents.executeJavaScript(`window.id = "${windowID}"`);
	window.webContents.openDevTools({ mode: "right" });
	wnd.packets = window;
}

function getFamilyWindow(windowID)
{
	return windows.get(windowID) ?? null;
}

/**
 * @param {string} windowID The windowID associated with any child
 * @param {"game"|"scripts"|"tools"|"packets"} type The type of window to return
 * @returns {?BrowserWindow}
 */
function getChildWindow(windowID, type)
{
	const wnd = getFamilyWindow(windowID);
	if (!wnd)
	{
		return null;
	}

	switch (type.toLowerCase())
	{
		case "game":
			return wnd.game;
		case "scripts":
			return wnd.scripts;
		case "tools":
			return wnd.tools;
		case "packets":
			return wnd.packets;
		default:
			return null;
	}
}

module.exports = {
	createManager,
	createGame,
	createScriptsWindow,
	createToolsWindow,
	createPacketsWindow,

	assignWindowID,

	getFamilyWindow,
	getChildWindow,
}