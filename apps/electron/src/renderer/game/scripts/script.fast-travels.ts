import { ipcRenderer } from 'electron/renderer';
import { IPC_EVENTS } from '../../../common/ipc-events';

let container: HTMLDivElement | null = null;
let roomNumber = 100_000;

window.addEventListener('ready', async () => {
	container = document.querySelector('#locations')!;

	const locations =
		(await ipcRenderer.invoke(IPC_EVENTS.READ_FAST_TRAVELS)) ?? [];

	{
		const input = document.querySelector(
			'#room-number',
		) as HTMLInputElement;
		input.addEventListener('input', () => {
			const val = Number.parseInt(input.value, 10);

			if (Number.isNaN(val)) {
				roomNumber = 100_000;
			}

			if (val < 1) {
				input.value = '1';
			} else if (val > 100_000) {
				input.value = '100000';
			} else {
				roomNumber = val;
			}
		});
	}

	for (const location of locations) {
		// The map to join is strictly required
		if (!location.map) {
			continue;
		}

		const div = document.createElement('div');
		div.className = 'col-12 col-md-6 col-xl-4';

		{
			const btn = document.createElement('button');
			btn.classList.add('btn', 'btn-primary', 'w-100');
			btn.textContent = location.name;

			// eslint-disable-next-line @typescript-eslint/no-loop-func
			btn.addEventListener('click', async () => {
				window.msgPort?.postMessage({
					event: IPC_EVENTS.FAST_TRAVEL,
					args: { ...location, roomNumber },
				});
			});

			div.appendChild(btn);
		}

		container.appendChild(div);
	}
});
