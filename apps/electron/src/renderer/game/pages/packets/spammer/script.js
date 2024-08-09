let on = false;
let delay = 1000;

const parent = window.opener;

window.addEventListener('DOMContentLoaded', () => {
	const $stop = $('#stop');
	const $start = $('#start');

	$stop.addEventListener('click', () => {
		on = false;
		$stop.classList.add('w3-disabled');
		$start.classList.remove('w3-disabled');
		parent.postMessage({ event: 'packets:spammer:off' });
	});
	$start.addEventListener('click', () => {
		on = true;
		$start.classList.add('w3-disabled');
		$stop.classList.remove('w3-disabled');

		const packets = $('#spammer').value;
		const delay = $('#delay').value;
		parent.postMessage({
			event: 'packets:spammer:on',
			args: { packets: packets.split('\n'), delay },
		});
	});
});
