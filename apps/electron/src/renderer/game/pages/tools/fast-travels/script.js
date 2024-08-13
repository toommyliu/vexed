const FileManager = require('../../../botting/util/FileManager');

const fileManager = new FileManager();
const parent = window.opener;

let $container;
let $buttons = [];

const getRoomNumber = () => {
	return document.getElementById('room-number').value;
};

window.addEventListener('DOMContentLoaded', async () => {
	$container = document.getElementById('locations');

	const locations = await fileManager
		.readJSON('fast-travels.json')
		.catch(() => null);

	if (!locations) {
		return;
	}

	for (const location of locations) {
		if (!location.map) {
			continue;
		}

		const $btn = document.createElement('button');
		$btn.classList.add('w3-btn', 'w3-border', 'w3-round-medium');
		$btn.textContent = location.name;

		$btn.addEventListener('click', async () => {
			for (const btn of $buttons) {
				btn.disabled = true;
			}

			parent.postMessage({
				event: 'tools:fasttravel:join',
				args: { ...location, roomNumber: getRoomNumber() },
			});
		});

		$container.appendChild($btn);
		$buttons.push($btn);
	}
});

window.addEventListener('message', (ev) => {
	const {
		data: { event },
	} = ev;

	switch (event) {
		case 'tools:fasttravel:ready':
			for (const btn of $buttons) {
				btn.disabled = false;
			}
			break;
	}
});
