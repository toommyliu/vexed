let on = false;
let delay = 1000;

let selectedLine = null;

const parent = window.opener;

window.addEventListener('DOMContentLoaded', () => {
	const $stop = document.getElementById('stop');
	const $start = document.getElementById('start');

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

		const packets = document.getElementById('spammer').value;
		const delay = document.getElementById('delay').value;
		parent.postMessage({
			event: 'packets:spammer:on',
			args: { packets: packets.split('\n'), delay },
		});
	});

	{
		const $btn = document.getElementById('clear');
		$btn.addEventListener('click', () => {
			document.getElementById('spammer').innerHTML = '';
		});
	}
	{
		const $spammer = document.getElementById('spammer');
		const $addBtn = document.getElementById('add');
		const $removeBtn = document.getElementById('remove');

		$addBtn.addEventListener('click', () => {
			const packet = document.getElementById('packet').value;
			const $div = document.createElement('div');
			$div.classList.add('line');
			$div.innerHTML = packet;
			$spammer.appendChild($div);
			$spammer.scrollTop = $spammer.scrollHeight;

			$div.addEventListener('click', (ev) => {
				if (selectedLine) {
					selectedLine.classList.remove('selected-line');
				}

				selectedLine = ev.target;
				selectedLine.classList.add('selected-line');
			});
		});
		$removeBtn.addEventListener('click', () => {
			if (selectedLine) {
				$spammer.removeChild(selectedLine);
				selectedLine = null;
			}
		});
	}
});
