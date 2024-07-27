let on = false;
let delay = 1000;

const parent = window.opener;

window.addEventListener('DOMContentLoaded', () => {
	const stop = document.getElementById('stop');
	const start = document.getElementById('start');

	stop.addEventListener('click', () => {
		on = false;
		stop.classList.add('w3-disabled');
		start.classList.remove('w3-disabled');
		parent.postMessage({ event: 'packets:spammer:off' });
	});
	start.addEventListener('click', () => {
		on = true;
		start.classList.add('w3-disabled');
		stop.classList.remove('w3-disabled');

		const packets = document.getElementById('spammer').value;
		const delay = document.getElementById('delay').value;
		parent.postMessage({
			event: 'packets:spammer:on',
			args: { packets: packets.split('\n'), delay },
		});
	});
});
