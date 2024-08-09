const FileManager = require('../../../botting/util/FileManager');

const fileManager = new FileManager();
const parent = window.opener;

const getRoomNumber = () => {
	return $('#room-number').value;
};

window.addEventListener('DOMContentLoaded', async () => {
	const $container = $('#locations');
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
			parent.postMessage({
				event: 'tools:fasttravel:join',
				args: { ...location, roomNumber: getRoomNumber() },
			});
		});

		$container.appendChild($btn);
	}
});
