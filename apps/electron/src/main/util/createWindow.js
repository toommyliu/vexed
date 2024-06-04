const { join } = require("path");
const { BrowserWindow, session } = require("electron");
const { nanoid } = require("nanoid");

const RENDERER = join(__dirname, "../../renderer");

/**
 * Manager window should have only 1 instance
 * Game windows are keyed by game_idx and can have the following windows associated with them:
 * 	Scripts
 *  Tools
 *  Packets
 */
const windows = {
	manager: null,
};

const userAgent =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36";

async function createMainWindow() {
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

	await window.loadFile(join(RENDERER, "manager.html"));
	windows.manager = window;
}

async function createGameWindow(account = null) {
	console.log("hi");

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
	const windowID = nanoid();

	window.webContents.setUserAgent(userAgent);
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders["User-Agent"] = userAgent;
		details.requestHeaders.artixmode = "launcher";
		callback({ requestHeaders: details.requestHeaders, cancel: false });
	});

	await window.loadFile(join(__dirname, "../../renderer/game.html"), {});
	window.webContents.openDevTools({ mode: "right" });
	window.maximize();

	// same thing
	window.webContents.send("generate-id", windowID);
	window.webContents.executeJavaScript(`
		window.id = "${windowID}"
		console.log("hello from me!");
	`)
	console.log(`created a window with id: ${windowID}`);

	windows[windowID] = {
		scripts: null,
		tools: null,
		packets: null,
	}

	if (account) {
		window.webContents.executeJavaScript(`window.account=${JSON.stringify(account)}`);
	}

	window.on("closed", () => {
		delete windows[windowID];
	});
}

async function createPacketsWindow(windowID) {
	const wnd = windows[windowID];

	if (wnd?.packets) {
		console.log(`blocked packets window creation for ${windowID}`)
		wnd?.packets.focus();
		return;
	}

	console.log(`create packets window for ${windowID}`);

	const window = new BrowserWindow({
		title: "Packets",
		width: 600,
		height: 300,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
		},
	});

	window.on("closed", () => {
		wnd.packets = null;
	});

	await window.loadFile(join(RENDERER, "pages/game/packets.html"));
	window.webContents.executeJavaScript(`window.id = "${windowID}"`);
	wnd.packets = window;
}

function getPacketsWindow(windowID) {
	return windows[windowID]?.packets;
}

module.exports = {
	createMainWindow,
	createGameWindow,
	createPacketsWindow,

	getPacketsWindow
}