import { ipcRenderer, type IpcRendererEvent } from 'electron/renderer';
import { WINDOW_IDS } from '../../../common/constants';
import { IPC_EVENTS } from '../../../common/ipc-events';
import PortMonitor from '../../../common/port-monitor';
import ipcFastTravelsHandler from './ipc.fast-travels';

const ports: Map<(typeof WINDOW_IDS)[keyof typeof WINDOW_IDS], MessagePort> =
	new Map();
const portMonitors: Map<
	(typeof WINDOW_IDS)[keyof typeof WINDOW_IDS],
	PortMonitor
> = new Map();
const handlers = new Map<
	(typeof WINDOW_IDS)[keyof typeof WINDOW_IDS],
	(ev: MessageEvent) => Promise<unknown> | unknown
>();

handlers.set(WINDOW_IDS.FAST_TRAVELS, ipcFastTravelsHandler);

window.ports = ports;
window.portMonitors = portMonitors;

ipcRenderer.on(
	IPC_EVENTS.SETUP_IPC,
	async (ev: IpcRendererEvent, windowId: string) => {
		const port = ev.ports[0];

		if (!port) {
			console.log(
				`Tried to set up ipc for ${windowId} but received no port?`,
			);
			return;
		}

		console.log(`Established peer ${windowId}.`);

		const _windowId =
			windowId as (typeof WINDOW_IDS)[keyof typeof WINDOW_IDS];

		ports.set(_windowId, port);
		port.start();

		port.addEventListener('message', async (ev) => {
			// Heartbeats are managed by PortMonitor
			if (
				ev.data.type === 'heartbeat' ||
				ev.data.type === 'heartbeat-ack'
			) {
				return;
			}

			handlers.get(_windowId)?.(ev);
		});

		const pm = new PortMonitor(port, () => {
			console.log(`Cleaning up existing ports for ${windowId}.`);
			port.close();
			ports.delete(windowId);
			portMonitors.delete(windowId);
		});

		portMonitors.set(windowId, pm);
	},
);
