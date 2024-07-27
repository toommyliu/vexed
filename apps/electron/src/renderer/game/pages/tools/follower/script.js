const parent = window.opener;

window.addEventListener('DOMContentLoaded', async () => {
	const me = document.getElementById('me');
	const start = document.getElementById('start');

	me.addEventListener('click', () => {
		parent.postMessage({
			event: 'follower:me',
		});
	});

	start.addEventListener('click', () => {
		const player = document.getElementById('player').value;
		const skills = document.getElementById('skills').value;
		const wait = document.getElementById('skill-wait').checked;
		const delay = document.getElementById('skill-delay').value;
		const attackPriority = document.getElementById('attack-priority').value;
		const copyWalk = document.getElementById('copy-walk').checked;

		if (start.checked) {
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

			document.getElementById('player').value = args;
			break;
	}
});
