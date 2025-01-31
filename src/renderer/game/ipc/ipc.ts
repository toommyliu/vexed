import { ipcRenderer, type IpcRendererEvent } from 'electron';
import { WINDOW_IDS } from '../../../common/constants';
import { IPC_EVENTS } from '../../../common/ipc-events';
import PortMonitor from '../../../common/port-monitor';
import ipcFastTravelsHandler from './ipc.fast-travels';
import ipcFollower from './ipc.follower';
import ipcLoaderGrabberHandler from './ipc.loader-grabber';
import ipcPacketLoggerHandler from './ipc.logger';
import ipcPacketSpammerHandler from './ipc.spammer';

const ports: Map<WindowId, MessagePort> = new Map();
const portMonitors: Map<WindowId, PortMonitor> = new Map();
const handlers = new Map<
	WindowId,
	(ev: MessageEvent) => Promise<unknown> | unknown
>();

handlers.set(WINDOW_IDS.FAST_TRAVELS, ipcFastTravelsHandler);
handlers.set(WINDOW_IDS.FOLLOWER, ipcFollower);
handlers.set(WINDOW_IDS.LOADER_GRABBER, ipcLoaderGrabberHandler);
handlers.set(WINDOW_IDS.PACKETS_LOGGER, ipcPacketLoggerHandler);
handlers.set(WINDOW_IDS.PACKETS_SPAMMER, ipcPacketSpammerHandler);

window.ports = ports;
window.portMonitors = portMonitors;

ipcRenderer.on(
	IPC_EVENTS.SETUP_IPC,
	async (ev: IpcRendererEvent, windowId: WindowId) => {
		const port = ev.ports[0];

		if (!port) {
			console.log(
				`Tried to establish ipc for ${windowId} but received no port?`,
			);
			return;
		}

		const prevPort = ports.get(windowId);
		const prevMonitor = portMonitors.get(windowId);

		if (prevPort || prevMonitor) {
			console.warn(`Cleaning existing ipc for ${windowId}.`);

			prevPort?.close();
			prevMonitor?.cleanup();

			ports.delete(windowId);
			portMonitors.delete(windowId);

			await bot.sleep(100);
		}

		ports.set(windowId, port);
		port.start();

		port.addEventListener('message', async (ev) => {
			// Heartbeats are managed by PortMonitor
			if (
				ev.data.type === 'heartbeat' ||
				ev.data.type === 'heartbeat-ack'
			) {
				return;
			}

			if (!handlers.has(windowId)) {
				console.warn(
					`Received message from ${windowId} but no handler is registered.`,
				);
				return;
			}

			// Forward this message to the correct handler
			handlers.get(windowId)?.(ev);
		});

		const pm = new PortMonitor(
			port,
			() => {
				console.log(`Established ipc with window id: ${windowId}.`);
			},
			() => {
				port.close();
				ports.delete(windowId);
				portMonitors.delete(windowId);
			},
			true,
		);

		portMonitors.set(windowId, pm);
	},
);
