const { Menu, dialog, ipcMain, BrowserWindow } = require("electron");
const fs = require("fs");

ipcMain.handle("loadScript", async () => {
	const browserWindow = BrowserWindow.getFocusedWindow();
	if (!browserWindow) return;

	const dialog_ = await dialog.showOpenDialog(browserWindow, {
		filters: [{ name: "JavaScript Files", extensions: ["js"] }],
		properties: ["openFile"],
	});
	if (dialog_.canceled) return;

	const scriptPath = dialog_.filePaths[0];
	const scriptBody = await fs.promises.readFile(scriptPath, "utf8");
	if (!scriptBody?.toString()) return;

	browserWindow.webContents.executeJavaScript(`
		document.getElementById('loaded-script')?.remove();
		var script = document.createElement('script');
		script.id = 'loaded-script';
		script.textContent = \`(async ()=>{console.log("script started", new Date());${scriptBody};console.log("script finished",new Date());})();\`;
		document.body.appendChild(script);
	`);
});

/**
 * @type {import('electron/common').MenuItemConstructorOptions[]}
 */
const template = [
	{
		label: "Vexed",
		submenu: [
			{ role: "about" },
			{ type: "separator" },
			{ role: "services" },
			{ type: "separator" },
			{ role: "hide" },
			{ role: "hideOthers" },
			{ role: "unhide" },
			{ type: "separator" },
			{ role: "quit" },
		],
	},
	{
		label: "File",
		submenu: [{ role: "close" }],
	},
	{
		label: "Edit",
		submenu: [
			{ role: "undo" },
			{ role: "redo" },
			{ type: "separator" },
			{ role: "cut" },
			{ role: "copy" },
			{ role: "paste" },
			{ role: "pasteAndMatchStyle" },
			{ role: "delete" },
			{ role: "selectAll" },
		],
	},
	{
		label: "Scripts",
		submenu: [
			{
				label: "Load",
				click: async (menuItem, browserWindow, event) => {
					const dialog_ = await dialog.showOpenDialog(browserWindow, {
						filters: [{ name: "JavaScript Files", extensions: ["js"] }],
						properties: ["openFile"],
					});
					if (dialog_.canceled) return;

					const scriptPath = dialog_.filePaths[0];
					const scriptBody = await fs.promises.readFile(scriptPath, "utf8");
					if (!scriptBody?.toString()) return;

					browserWindow.webContents.executeJavaScript(`
					document.getElementById('loaded-script')?.remove();
					var script = document.createElement('script');
					script.id = 'loaded-script';
					script.textContent = \`(async ()=>{console.log("script started", new Date());${scriptBody};console.log("script finished",new Date());})();\`;
					document.body.appendChild(script);
				`);
				},
			},
		],
	},
	// {
	// 	label: 'Options',
	// 	submenu: [
	// 		{
	// 			label: 'Infinite Range',
	// 			type: 'checkbox',
	// 			click: (menuItem, browserWindow, event) => {
	// 				browserWindow.webContents.send('options:infiniteRange', menuItem.checked);
	// 			},
	// 		},
	// 		{
	// 			label: 'Provoke',
	// 			type: 'checkbox',
	// 			click: (menuItem, browserWindow, event) => {
	// 				browserWindow.webContents.send('options:provokeMonsters', menuItem.checked);
	// 			},
	// 		},
	// 		{
	// 			label: 'Enemy Magnet',
	// 			type: 'checkbox',
	// 			click: (menuItem, browserWindow, event) => {
	// 				browserWindow.webContents.send('options:enemyMagnet', menuItem.checked);
	// 			},
	// 		},
	// 		{
	// 			label: 'Lag Killer',
	// 			type: 'checkbox',
	// 			click: (menuItem, browserWindow, event) => {
	// 				browserWindow.webContents.send('options:lagKiller', menuItem.checked);
	// 			},
	// 		},
	// 		{
	// 			label: 'Hide Players',
	// 			type: 'checkbox',
	// 			click: (menuItem, browserWindow, event) => {
	// 				browserWindow.webContents.send('options:hidePlayers', menuItem.checked);
	// 			},
	// 		},
	// 		{
	// 			label: 'Skip Cutscenes',
	// 			type: 'checkbox',
	// 			click: (menuItem, browserWindow, event) => {
	// 				browserWindow.webContents.send('options:skipCutscenes', menuItem.checked);
	// 			},
	// 		},
	// 	],
	// }
];

function setupMenu() {
	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

module.exports = setupMenu;
