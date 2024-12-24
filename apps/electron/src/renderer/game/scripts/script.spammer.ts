import { IPC_EVENTS } from '../../../common/ipc-events';

const packets: string[] = [];
let on = false;

let selectedLine: HTMLElement | null = null;

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
		const btn = document.querySelector('#clear') as HTMLButtonElement;
		btn.addEventListener('click', () => {
			document.querySelector('#spammer')!.innerHTML = '';
			packets.length = 0;
		});
	}

	{
		const spammer = document.querySelector('#spammer') as HTMLDivElement;

		const removeBtn = document.querySelector(
			'#remove',
		) as HTMLButtonElement;
		const addBtn = document.querySelector('#add') as HTMLButtonElement;

		addBtn.addEventListener('click', () => {
			const packet = (
				document.querySelector('#packet') as HTMLInputElement
			).value;

			if (!packet.length) return;

			packets.push(packet);

			{
				const div = document.createElement('div');
				div.classList.add('line', 'rounded');
				div.innerHTML = packet;
				div.addEventListener('click', (ev) => {
					if (selectedLine)
						selectedLine.classList.remove('selected-line');

					if (ev.target === selectedLine) {
						selectedLine = null;
					} else {
						selectedLine = ev.target as HTMLElement;
						selectedLine.classList.add('selected-line');
						removeBtn.classList.remove('disabled');
					}
				});
				spammer.appendChild(div);
			}

			spammer.scrollTo(0, spammer.scrollHeight);
		});

		removeBtn.addEventListener('click', () => {
			if (!selectedLine) return;

			selectedLine.remove();
			selectedLine = null;

			setButtonState(removeBtn, true);

			const index = packets.indexOf(selectedLine!.innerHTML);
			packets.splice(index, 1);
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
				event: IPC_EVENTS.PACKET_SPAMMER_STOP,
			});
		});

		onBtn.addEventListener('click', () => {
			on = true;

			setButtonState(stopBtn, false);
			setButtonState(onBtn, true);

			window.msgPort?.postMessage({
				event: IPC_EVENTS.PACKET_SPAMMER_START,
				args: {
					packets,
					delay:
						Number.parseInt(
							(
								document.querySelector(
									'#delay',
								) as HTMLInputElement
							).value,
							10,
						) ?? 1_000,
				},
			});
		});
	}

	window.addEventListener('port-ready', () => {
		// Are we running but the port was closed?
		if (on) {
			console.warn('Port was closed but we are still running, stopping.');

			// Let's just safely close everything
			window.msgPort?.postMessage({
				event: IPC_EVENTS.PACKET_SPAMMER_STOP,
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
