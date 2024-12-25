import { ipcRenderer } from 'electron/renderer';
import { IPC_EVENTS } from '../../../common/ipc-events';

let container: HTMLDivElement | null = null;
let roomNumber = 100_000;

window.addEventListener('ready', async () => {
	container = document.querySelector('#locations')!;

	const locations =
		(await ipcRenderer.invoke(IPC_EVENTS.READ_FAST_TRAVELS)) ?? [];

	const input = document.querySelector('#room-number') as HTMLInputElement;

	input.addEventListener('input', () => {
		const val = Number.parseInt(input.value, 10);

		if (Number.isNaN(val)) {
			roomNumber = 100_000;
			return;
		}

		if (val < 1) {
			input.value = '1';
			roomNumber = 1;
		} else if (val > 100_000) {
			input.value = '100000';
			roomNumber = 100_000;
		} else {
			roomNumber = val;
		}
	});

	for (const location of locations) {
		if (!location.map) {
			continue;
		}

		const div = document.createElement('div');

		{
			const btn = document.createElement('button');
			btn.classList.add('w3-button', 'w3-round-medium');
			btn.textContent = location.name;

			// eslint-disable-next-line @typescript-eslint/no-loop-func
			btn.addEventListener('click', async () => {
				window.msgPort?.postMessage({
					event: IPC_EVENTS.FAST_TRAVEL,
					args: {
						...location,
						roomNumber,
					},
				});
			});

			div.appendChild(btn);
			container.appendChild(div);
		}
	}
});
