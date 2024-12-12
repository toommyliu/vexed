import { ipcRenderer } from 'electron/renderer';
import { WINDOW_IDS } from '../../../common/constants';
import { IPC_EVENTS } from '../../../common/ipc-events';
import PortMonitor from '../../../common/port-monitor';

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

	ipcRenderer.postMessage(IPC_EVENTS.SETUP_IPC, WINDOW_IDS.FOLLOWER, [
		transferPort,
	]);

	new PortMonitor(
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

		if (ev.data.event === IPC_EVENTS.FOLLOWER_ME) {
			(document.querySelector('#player') as HTMLInputElement).value =
				ev.data.args.name;
		}
	});
}

function toggleState(state: boolean) {
	{
		const input = document.querySelector('#player');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const btn = document.querySelector('#me');
		if (state) {
			btn?.setAttribute('disabled', 'true');
		} else {
			btn?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#skill-list');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#skill-wait');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#skill-delay');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#copy-walk');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}

	{
		const input = document.querySelector('#attack-priority');
		if (state) {
			input?.setAttribute('disabled', 'true');
		} else {
			input?.removeAttribute('disabled');
		}
	}
}

window.addEventListener('DOMContentLoaded', async () => {
	await setupHeartbeat();

	{
		const btn = document.querySelector('#me') as HTMLButtonElement;
		btn.addEventListener('click', async () => {
			g_msgPort?.postMessage({ event: IPC_EVENTS.FOLLOWER_ME });
		});
	}

	{
		const input = document.querySelector('#start') as HTMLInputElement;
		input.addEventListener('click', async () => {
			toggleState(input.checked);

			// See if button is checked
			if (input.checked) {
				const name = (
					document.querySelector('#player') as HTMLInputElement
				).value;

				g_msgPort?.postMessage({
					event: IPC_EVENTS.FOLLOWER_START,
					args: {
						name,
						skillList: (
							document.querySelector(
								'#skill-list',
							) as HTMLInputElement
						).value,
						skillWait: (
							document.querySelector(
								'#skill-wait',
							) as HTMLInputElement
						).checked,
						skillDelay: (
							document.querySelector(
								'#skill-delay',
							) as HTMLInputElement
						).value,
						copyWalk: (
							document.querySelector(
								'#copy-walk',
							) as HTMLInputElement
						).checked,
						attackPriority: (
							document.querySelector(
								'#attack-priority',
							) as HTMLInputElement
						).value,
					},
				});
			} else {
				g_msgPort?.postMessage({
					event: IPC_EVENTS.FOLLOWER_STOP,
				});
			}
		});
	}
});

window.addEventListener('beforeunload', () => {
	g_msgPort?.close();
});
