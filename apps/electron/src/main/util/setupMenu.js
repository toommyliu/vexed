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
		label: 'Scripts',
		submenu: [
			{
				label: 'Load',
				click: async (menuItem, browserWindow, event) => {
					const dialog_ = await dialog.showOpenDialog(browserWindow, {
						filters: [{ extensions: ['js'] }],
						properties: ['openFile', 'openDirectory'],
					});
					if (dialog_.canceled) return;

					const scriptPath = dialog_.filePaths[0];
					const scriptBody = await fs.promises.readFile(scriptPath, 'utf8');

					browserWindow.webContents.executeJavaScript(`
							if (document.getElementById('loaded-script')) {
								document.body.removeChild(document.getElementById('loaded-script'));
								console.log('removed old script');
							}
	
							const script = document.createElement('script');
							script.id = 'loaded-script';
						script.textContent = \`(async ()=>{
							${scriptBody}
						})();\`;
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
