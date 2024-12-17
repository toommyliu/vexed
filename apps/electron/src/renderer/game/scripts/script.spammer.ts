import { IPC_EVENTS } from '../../../common/ipc-events';

let selectedLine: HTMLElement | null = null;

let packets: string[] = [];
let on = false;

window.addEventListener('ready', async () => {
	{
		const btn = document.querySelector('#clear') as HTMLButtonElement;
		btn.addEventListener('click', () => {
			document.querySelector('#spammer')!.innerHTML = '';
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

			removeBtn.classList.add('disabled');

			const index = packets.findIndex(
				(packet) => packet === selectedLine!.innerHTML,
			);
			packets.splice(index, 1);
		});
	}

	{
		const stopBtn = document.querySelector('#stop') as HTMLButtonElement;
		const onBtn = document.querySelector('#start') as HTMLButtonElement;

		stopBtn.addEventListener('click', () => {
			on = false;
			stopBtn.disabled = true;
			stopBtn.classList.add('disabled');
			onBtn.disabled = false;
			onBtn.classList.remove('disabled');

			window.msgPort?.postMessage({
				event: IPC_EVENTS.PACKET_SPAMMER_STOP,
			});
		});

		onBtn.addEventListener('click', () => {
			on = true;
			onBtn.disabled = true;
			onBtn.classList.add('disabled');
			stopBtn.disabled = false;
			stopBtn.classList.remove('disabled');

			window.msgPort?.postMessage({
				event: IPC_EVENTS.PACKET_SPAMMER_START,
				args: {
					packets,
					delay: Number.parseInt(
						(document.querySelector('#delay') as HTMLInputElement)
							.value,
						10,
					) ?? 1_000,
				},
			});
		});
	}
});
