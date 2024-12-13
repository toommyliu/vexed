import { IPC_EVENTS } from '../../../common/ipc-events';

const packets: string[] = [];
let on = false;

window.addEventListener('ready', async () => {
	{
		const btn = document.querySelector('#save') as HTMLButtonElement;
	}
	{
		const btn = document.querySelector('#copy-all') as HTMLButtonElement;
	}
	{
		const btn = document.querySelector('#clear') as HTMLButtonElement;
	}

	const stopBtn = document.querySelector('#stop') as HTMLButtonElement;
	const onBtn = document.querySelector('#start') as HTMLButtonElement;

	stopBtn.addEventListener('click', () => {
		on = false;
		stopBtn.disabled = true;
		stopBtn.classList.add('disabled');
		onBtn.disabled = false;
		onBtn.classList.remove('disabled');

		window.msgPort?.postMessage({ event: IPC_EVENTS.PACKET_LOGGER_STOP });
	});

	onBtn.addEventListener('click', () => {
		on = true;
		onBtn.disabled = true;
		onBtn.classList.add('disabled');
		stopBtn.disabled = false;
		stopBtn.classList.remove('disabled');

		window.msgPort?.postMessage({ event: IPC_EVENTS.PACKET_LOGGER_START });
	});

	window.addMsgHandler(async (ev) => {
		if (ev.data.event === IPC_EVENTS.PACKET_LOGGER_PACKET) {
			if (on) {
				const packet: string = ev.data.args.packet;
				const pkt = packet.substring(17);

				const div = document.createElement('div');
				div.classList.add('line');
				div.textContent = pkt;

				div.addEventListener('click', async () => {
					await navigator.clipboard.writeText(pkt);
				});

				document.querySelector('#logger')?.appendChild(div);
				document
					.querySelector('#logger')
					?.scrollTo(
						0,
						document.querySelector('#logger')!.scrollHeight,
					);

				packets.push(pkt);
			}
		}
	});
});
