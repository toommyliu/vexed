import { IPC_EVENTS } from '../../../common/ipc-events';

const packets: string[] = [];
let on = false;

/**
 * Sets the state of a button
 *
 * @param el - The button element
 * @param state - The state to set the button to
 */
function setButtonState(el: HTMLButtonElement, state: boolean) {
	el.disabled = state;
	if (state) {
		el.classList.add('disabled');
	} else {
		el.classList.remove('disabled');
	}
}

window.addEventListener('ready', async () => {
	{
		const btn = document.querySelector('#save') as HTMLButtonElement;
		btn.addEventListener('click', async () => {
			if (!packets.length) return;

			const blob = new Blob([packets.join('\n')], { type: 'text/plain' });
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = 'packets.txt';
			a.click();
		});
	}

	{
		const btn = document.querySelector('#copy-all') as HTMLButtonElement;
		btn.addEventListener('click', async () => {
			await navigator.clipboard.writeText(packets.join('\n'));
		});
	}

	{
		const btn = document.querySelector('#clear') as HTMLButtonElement;
		btn.addEventListener('click', () => {
			document.querySelector('#logger')!.innerHTML = '';
			packets.length = 0;
		});
	}

	{
		const stopBtn = document.querySelector('#stop') as HTMLButtonElement;
		const onBtn = document.querySelector('#start') as HTMLButtonElement;

		stopBtn.addEventListener('click', () => {
			on = false;

			setButtonState(stopBtn, true);
			setButtonState(onBtn, false);

			window.msgPort?.postMessage({
				event: IPC_EVENTS.PACKET_LOGGER_STOP,
			});
		});

		onBtn.addEventListener('click', () => {
			on = true;

			setButtonState(stopBtn, false);
			setButtonState(onBtn, true);

			window.msgPort?.postMessage({
				event: IPC_EVENTS.PACKET_LOGGER_START,
			});
		});
	}

	window.addMsgHandler(async (ev) => {
		if (ev.data.event === IPC_EVENTS.PACKET_LOGGER_PACKET && on) {
			const { packet }: { packet: string } = ev.data.args;
			const pkt = packet.slice(17);

			const container = document.querySelector('#logger');

			{
				const div = document.createElement('div');
				div.classList.add('line');
				div.textContent = pkt;
				div.addEventListener('click', async () => {
					await navigator.clipboard.writeText(pkt);
				});
				container!.appendChild(div);
			}

			container!.scrollTo(0, container!.scrollHeight);
			packets.push(pkt);
		}
	});

	window.addEventListener('port-ready', () => {
		// Are we running but the port was closed?
		if (on) {
			console.warn('Port was closed but we are still running, stopping.');

			// Let's just safely close everything
			window.msgPort?.postMessage({
				event: IPC_EVENTS.PACKET_LOGGER_STOP,
			});

			// Enable buttons
			const stopBtn = document.querySelector(
				'#stop',
			) as HTMLButtonElement;
			const onBtn = document.querySelector('#start') as HTMLButtonElement;

			on = false;

			setButtonState(stopBtn, true);
			setButtonState(onBtn, false);
		}
	});
});
