const { Menu, dialog } = require('electron');
const { join } = require('path');
const fs = require('fs');

/**
 * @type {import('electron/common').MenuItemConstructorOptions[]}
 */
const template = [
	{
		label: 'Vexed',
		submenu: [
			{ role: 'about' },
			{ type: 'separator' },
			{ role: 'services' },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' },
		],
	},
	{
		label: 'File',
		submenu: [{ role: 'close' }],
	},
	{
		label: 'Edit',
		submenu: [
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ role: 'pasteAndMatchStyle' },
			{ role: 'delete' },
			{ role: 'selectAll' },
		],
	},
	{
		label: 'Scripts',
		submenu: [
			{
				label: 'Load',
				click: async (menuItem, browserWindow, event) => {
					const dialog_ = await dialog.showOpenDialog(browserWindow, {
						filters: [{ name: 'JavaScript Files', extensions: ['js'] }],
						properties: ['openFile'],
					});
					if (dialog_.canceled) return;

					const scriptPath = dialog_.filePaths[0];
					const scriptBody = await fs.promises.readFile(scriptPath, 'utf8');
					if (!scriptBody?.toString()) return;

					browserWindow.webContents.executeJavaScript(`
						document.getElementById('loaded-script')?.remove();
						var script = document.createElement('script');
						script.id = 'loaded-script';
						script.textContent = \`(async ()=>{${scriptBody}})();\`;
						document.body.appendChild(script);
					`);
				},
			},
			{
				label: 'Enabled',
				type: 'checkbox',
				click: (menuItem, browserWindow, event) => {
					const on = menuItem.checked;
					if (on) {
						browserWindow.webContents.executeJavaScript('Bot.getInstance().start()');
					} else {
						browserWindow.webContents.executeJavaScript('Bot.getInstance().stop()');
					}
				},
			},
		],
	},
];

function setupMenu() {
	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

module.exports = setupMenu;
