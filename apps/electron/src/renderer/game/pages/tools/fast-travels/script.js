const FileManager = require('../../../botting/util/FileManager');

const fileManager = new FileManager();
const parent = window.opener;

const getRoomNumber = () => {
	return document.getElementById('room-number').value;
};

window.addEventListener('DOMContentLoaded', async () => {
	const container = document.getElementById('locations');
	const locations = await fileManager.readJSON('fast-travels.json');

	for (const location of locations) {
		const btn = document.createElement('button');
		btn.classList.add('w3-button');
		btn.style = 'background-color: #2f2f2f';
		btn.textContent = location.name;

		btn.addEventListener('click', async () => {
			parent.postMessage({
				event: 'fast-travel',
				args: { ...location, roomNumber: getRoomNumber() },
			});
		});

		container.appendChild(btn);
	}
});
