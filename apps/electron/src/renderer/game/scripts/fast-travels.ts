import { ipcRenderer } from 'electron/renderer';
import { WINDOW_IDS } from '../../../common/constants';
import { IPC_EVENTS } from '../../../common/ipc-events';
import PortMonitor from '../../../common/port-monitor';

let container: HTMLDivElement | null = null;
let roomNumber: number = 100000;

const buttons: HTMLButtonElement[] = [];

let g_msgPort: MessagePort | null = null;

async function setupHeartbeat() {
	// New ports are required, if previous ones are closed
	const channel = new MessageChannel();
	const transferPort = channel.port1;
	const msgPort = channel.port2;
	g_msgPort = msgPort;

	// Start both ports
	transferPort.start();
	msgPort.start();

	ipcRenderer.postMessage(IPC_EVENTS.SETUP_IPC, WINDOW_IDS.FAST_TRAVELS, [
		transferPort,
	]);

	/*const pm = */ new PortMonitor(
		msgPort,
		() => {
			console.info('Established ipc with parent.');
		},
		() => {
			msgPort.close();
			transferPort.close();
			g_msgPort = null;
			console.info('Trying to re-establish heartbeat in 1s.');
			setTimeout(() => {
				void setupHeartbeat();
			}, 1_000);
		},
		false,
	);

	msgPort.addEventListener('message', async (ev) => {
		if (ev.data.type === 'heartbeat' || ev.data.type === 'heartbeat-ack') {
			return;
		}

		// console.log('msg from game', ev);
	});
}

window.addEventListener('DOMContentLoaded', async () => {
	await setupHeartbeat();

	container = document.querySelector('#locations')!;

	const locations =
		(await ipcRenderer.invoke(IPC_EVENTS.READ_FAST_TRAVELS)) ?? [];

	for (const location of locations) {
		// The map to join is strictly required
		if (!location.map) {
			continue;
		}

		const div = document.createElement('div');
		div.className = 'col-12 col-md-6 col-xl-4';

		const btn = document.createElement('button');
		btn.classList.add('btn', 'btn-primary', 'w-100');
		btn.textContent = location.name;

		// eslint-disable-next-line @typescript-eslint/no-loop-func
		btn.addEventListener('click', async () => {
			if (!g_msgPort) {
				await setupHeartbeat();
			}

			g_msgPort?.postMessage({
				event: IPC_EVENTS.FAST_TRAVEL,
				args: { ...location, roomNumber },
			});
		});

		div.appendChild(btn);
		container.appendChild(div);

		buttons.push(btn);
	}
});

window.addEventListener('beforeunload', () => {
	g_msgPort?.close();
});
