const { ipcRenderer } = require('electron');

const parent = window.opener;

let container;

const packets = [];
let on = false;

window.addEventListener('DOMContentLoaded', () => {
	container = document.getElementById('logger');

	const save = document.getElementById('save');
	const copy = document.getElementById('copy');
	const clear = document.getElementById('clear');

	const stop = document.getElementById('stop');
	const start = document.getElementById('start');

	save.addEventListener('click', () => {
		ipcRenderer.send('packets:save', packets);
	});

	copy.addEventListener('click', async () => {
		await navigator.clipboard.writeText(packets.join('\n')).catch(() => {});
	});

	clear.addEventListener('click', () => {
		packets.length = 0;
		container.innerHTML = '';
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
				const pkt = packet.substring(17);

				const div = document.createElement('div');
				div.classList.add('line');
				div.textContent = pkt;

				div.addEventListener('click', async () => {
					await navigator.clipboard.writeText(pkt);
				});

				container.appendChild(div);
				container.scrollTop = container.scrollHeight;

				packets.push(pkt);
			}
			break;
	}
};
