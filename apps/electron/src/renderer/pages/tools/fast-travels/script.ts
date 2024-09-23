import { FileManager } from '../../../api/util/FileManager';

const fileManager = new FileManager();
const parent = window.opener;

let $container: HTMLElement | null = null;
const $buttons: HTMLButtonElement[] = [];

const getRoomNumber = () =>
	(document.querySelector('#room-number') as HTMLInputElement).value;

window.addEventListener('DOMContentLoaded', async () => {
	$container = document.querySelector('#locations')!;

	const locations = await fileManager
		.readJSON('fast-travels.json')
		.then((data) => data as unknown as Location[])
		.catch(() => null);

	if (!locations) {
		return;
	}

	for (const location of locations) {
		// The map to join is strictly required
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

type Location = {
	/**
	 * The cell to jump to.
	 */
	cell?: string;
	/**
	 * The map name to join.
	 */
	map: string;
	/**
	 * The name as shown in the ui.
	 */
	name: string;
	/**
	 * The pad to jump to.
	 */
	pad?: string;
};
