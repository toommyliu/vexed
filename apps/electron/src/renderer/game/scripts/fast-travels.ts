import { ipcRenderer } from 'electron/renderer';
import { IPC_EVENTS } from '../../../common/ipc-events';

let container: HTMLDivElement | null = null;
const buttons: HTMLButtonElement[] = [];

function getRoomNumber() {
	return (document.querySelector('#room-number') as HTMLInputElement).value;
}

window.addEventListener('DOMContentLoaded', async () => {
	container = document.querySelector('#locations')!;

	const locations =
		(await ipcRenderer.invoke(IPC_EVENTS.READ_FAST_TRAVELS)) ?? [];

	for (const location of locations) {
		// The map to join is strictly required
		if (!location.map) {
			continue;
		}

		const div = document.createElement('div');
		div.className = 'col-6';

		const btn = document.createElement('button');
		btn.classList.add('btn', 'btn-primary', 'w-100');
		btn.textContent = location.name;

		btn.addEventListener('click', async () => {
			ipcRenderer.send(IPC_EVENTS.FAST_TRAVEL, {
				...location,
				roomNumber: getRoomNumber(),
			});
		});

		div.appendChild(btn);
		container.appendChild(div);

		buttons.push(btn);
	}
});

window.addEventListener('message', (ev) => {
	console.log('ev', ev);
});
