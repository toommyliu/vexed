let on = false;
const delay = 1_000;

let selectedLine: HTMLElement | null = null;

// @ts-expect-error this is what we actually want
const parent = window.opener;

window.addEventListener('DOMContentLoaded', () => {
	const $stop: HTMLElement = document.querySelector('#stop')!;
	const $start: HTMLElement = document.querySelector('#start')!;

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

		const packets = (document.querySelector('#packets') as HTMLInputElement)
			.value;
		const delay = (document.querySelector('#delay') as HTMLInputElement)
			.value;
		parent.postMessage({
			event: 'packets:spammer:on',
			args: { packets: packets.split('\n'), delay },
		});
	});

	{
		const $btn = document.querySelector('#clear')!;
		$btn.addEventListener('click', () => {
			document.querySelector('#spammer')!.innerHTML = '';
		});
	}

	{
		const $spammer = document.querySelector('#spammer')!;
		const $addBtn = document.querySelector('#add')!;
		const $removeBtn = document.querySelector('#remove')!;

		$addBtn.addEventListener('click', () => {
			const packet = (
				document.querySelector('#packet') as HTMLInputElement
			).value;
			const $div = document.createElement('div');
			$div.classList.add('line');
			$div.innerHTML = packet;
			$spammer.appendChild($div);
			$spammer.scrollTop = $spammer.scrollHeight;

			$div.addEventListener('click', (ev) => {
				if (selectedLine) {
					selectedLine.classList.remove('selected-line');
				}

				selectedLine = ev.target as HTMLElement;
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
