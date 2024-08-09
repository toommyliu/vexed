const parent = window.opener;

window.addEventListener('DOMContentLoaded', async () => {
	{
		const $btn = $('#me');
		$btn.addEventListener('click', () => {
			parent.postMessage({
				event: 'follower:me',
			});
		});
	}

	{
		const $start = $('#start');
		$start.addEventListener('click', () => {
			if ($start.checked) {
				const player = $('#player').value;
				const skills = $('#skills').value;
				const wait = $('#skill-wait').checked;
				const delay = $('#skill-delay').value;
				const attackPriority = $('#attack-priority').value;
				const copyWalk = $('#copy-walk').checked;

				const config = {
					player,
					skills: skills.split(',').map((s) => s.trim()),
					skillWait: wait ?? false,
					skillDelay: delay ?? 150,
					attackPriority: attackPriority ?? [],
					copyWalk: copyWalk ?? false,
				};
				parent.postMessage({ event: 'follower:start', args: config });
			} else {
				parent.postMessage({ event: 'follower:stop' });
			}
		});
	}
});

window.addEventListener('message', (ev) => {
	const {
		data: { event, args },
	} = ev;

	switch (event) {
		case 'follower:me':
			if (args === 'null') {
				return;
			}

			$('#player').value = args;
			break;
	}
});
