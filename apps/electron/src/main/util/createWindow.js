const fs = require("fs");
const { join } = require("path");
const { app, BrowserWindow, session } = require("electron");

const userAgent =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36";

async function createWindow(account = null) {
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

	window.webContents.setUserAgent(userAgent);
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders["User-Agent"] = userAgent;
		details.requestHeaders.artixmode = "launcher";
		callback({ requestHeaders: details.requestHeaders, cancel: false });
	});

	await window.loadFile(join(__dirname, "../../renderer/game.html"));
	window.webContents.executeJavaScript(`window.account=${JSON.stringify(account)}`);
	window.webContents.openDevTools({ mode: "right" });

	window.focus();
	window.maximize();
}

module.exports = createWindow;