import { ipcRenderer } from 'electron';

let $container: HTMLElement | null = null;

const packets: string[] = [];
let on = false;

window.addEventListener('DOMContentLoaded', () => {
	$container = document.querySelector('#logger');

	const save = document.querySelector('#save') as HTMLInputElement;
	const copy = document.querySelector('#copy') as HTMLButtonElement;
	const clear = document.querySelector('#clear') as HTMLButtonElement;

	const stop = document.querySelector('#stop') as HTMLButtonElement;
	const start = document.querySelector('#start') as HTMLButtonElement;

	save.addEventListener('click', () => {
		ipcRenderer.send('packets:save', packets);
	});

	copy.addEventListener('click', async () => {
		await navigator.clipboard.writeText(packets.join('\n')).catch(() => {});
	});

	clear.addEventListener('click', () => {
		packets.length = 0;
		$container!.innerHTML = '';
	});

	stop.addEventListener('click', () => {
		on = false;
		stop.classList.add('w3-disabled');
		start.classList.remove('w3-disabled');
	});

	start.addEventListener('click', () => {
		on = true;
		start.classList.add('w3-disabled');
		stop.classList.remove('w3-disabled');
	});
});

window.onmessage = (ev) => {
	const {
		data: { event, args },
	} = ev;

	switch (event) {
		case 'logger:packet':
			if (on) {
				const packet = args;
				const pkt = packet.slice(17);

				const div = document.createElement('div');
				div.classList.add('line');
				div.textContent = pkt;

				div.addEventListener('click', async () => {
					await navigator.clipboard.writeText(pkt);
				});

				$container!.appendChild(div);
				$container!.scrollTop = $container!.scrollHeight;

				packets.push(pkt);
			}

			break;
	}
};
