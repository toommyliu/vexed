var { ipcRenderer: ipc } = require('electron');

ipc.on('generate-id', (event, windowID) => {
	console.log(`Your shared ID is: "${windowID}"`);
	window.id = windowID;
});

ipc.on('game:login', function (event, account) {
	window.account = account;
});

$(window).on('message', async function (event) {
});
