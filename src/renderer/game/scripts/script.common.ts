import { ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../../../common/ipc-events';
import PortMonitor from '../../../common/port-monitor';

let g_msgPort: MessagePort | null = null;

const msgHandlers: MessageHandler[] = [];

function addMsgHandler(handler: MessageHandler) {
	msgHandlers.push(handler);
}

async function setupHeartbeat() {
	const windowId = await ipcRenderer.invoke(IPC_EVENTS.GET_WINDOW_ID);
	if (!windowId) {
		console.warn('Failed to get window id, setup failed.');
		return;
	}

	return new Promise((resolve) => {
		const channel = new MessageChannel();
		const transferPort = channel.port1;
		const sharedPort = channel.port2;
		g_msgPort = sharedPort;

		// Start both ports
		transferPort.start();
		sharedPort.start();

		ipcRenderer.postMessage(IPC_EVENTS.SETUP_IPC, windowId, [transferPort]);

		new PortMonitor(
			sharedPort,
			() => {
				console.info('Established ipc with parent.');
				g_msgPort = sharedPort;
				window.msgPort = sharedPort;
				window.dispatchEvent(new Event('port-ready'));
				resolve(void 0);
			},
			() => {
				sharedPort.close();
				transferPort.close();
				g_msgPort = null;
				window.msgPort = null;
				console.info('Trying to re-establish heartbeat in 1s.');
				setTimeout(() => {
					void setupHeartbeat();
				}, 1_000);
			},
			false,
		);

		sharedPort.addEventListener('message', async (ev) => {
			if (
				ev.data.type === 'heartbeat' ||
				ev.data.type === 'heartbeat-ack'
			) {
				return;
			}

			for (const handler of msgHandlers) await handler(ev);
		});
	});
}

window.addEventListener('DOMContentLoaded', async () => {
	await setupHeartbeat();
	window.addMsgHandler = addMsgHandler;
	window.dispatchEvent(new Event('ready'));
});

window.addEventListener('beforeunload', () => {
	g_msgPort?.close();
	window.msgPort?.close();
});
