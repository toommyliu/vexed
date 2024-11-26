import { Mutex } from 'async-mutex';
import { ipcRenderer, type IpcRendererEvent } from 'electron/renderer';
import { IPC_EVENTS } from '../../../common/ipc-events';
import PortMonitor from '../../../common/port-monitor';
import type { Location } from '../../../main/FileManager';

const { player, world } = bot;
const mutex = new Mutex();

const ports: Map<string, MessagePort> = new Map();
const portMonitors: Map<string, PortMonitor> = new Map();

window.ports = ports;
window.portMonitors = portMonitors;

async function fastTravelsMsgHandler(ev: MessageEvent) {
	if (ev.data.event === IPC_EVENTS.FAST_TRAVEL) {
		const { args } = ev.data;

		if (!bot.player.isReady()) {
			return;
		}

		if (args?.map) {
			const cell = args?.cell ?? 'Enter';
			const pad = args?.pad ?? 'Spawn';
			const roomNumber = args?.roomNumber ?? 100_000;

			await world.join(`${args?.map}-${roomNumber}`, cell, pad);
		}
	}
}

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

			switch (windowId) {
				case 'tools:fast-travels': {
					await fastTravelsMsgHandler(ev);
					break;
				}
			}
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

ipcRenderer.on(
	IPC_EVENTS.FAST_TRAVEL,
	async (ev: IpcRendererEvent, location: Location) => {
		await mutex.runExclusive(async () => {
			if (!player.isReady()) {
				return;
			}

			const { map, cell, pad, roomNumber } = location;

			await world.join(`${map}-${roomNumber}`, cell, pad);
		});
	},
);
