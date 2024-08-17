const parent = window.opener;

const start = () => {
	document.getElementById('player').disabled = true;
	document.getElementById('skills').disabled = true;
	document.getElementById('skill-wait').disabled = true;
	document.getElementById('skill-delay').disabled = true;
	document.getElementById('attack-priority').disabled = true;
	document.getElementById('copy-walk').disabled = true;
	document.getElementById('me').disabled = true;
};

const stop = () => {
	document.getElementById('player').disabled = false;
	document.getElementById('skills').disabled = false;
	document.getElementById('skill-wait').disabled = false;
	document.getElementById('skill-delay').disabled = false;
	document.getElementById('attack-priority').disabled = false;
	document.getElementById('copy-walk').disabled = false;
	document.getElementById('me').disabled = false;
	if (document.getElementById('start').checked) {
		document.getElementById('start').checked = false;
	}
};

window.addEventListener('DOMContentLoaded', async () => {
	{
		const $btn = document.getElementById('me');
		$btn.addEventListener('click', () => {
			parent.postMessage({
				event: 'follower:me',
			});
		});
	}

	{
		const $btn = document.getElementById('start');
		$btn.addEventListener('click', () => {
			if ($btn.checked) {
				const player = document.getElementById('player').value;
				const skills = document.getElementById('skills').value;
				const wait = document.getElementById('skill-wait').checked;
				const delay = document.getElementById('skill-delay').value;
				const attackPriority =
					document.getElementById('attack-priority').value;
				const copyWalk = document.getElementById('copy-walk').checked;

				const config = {
					player,
					skills: skills.split(',').map((s) => s.trim()),
					skillWait: wait ?? false,
					skillDelay: delay ?? 150,
					attackPriority: attackPriority ?? [],
					copyWalk: copyWalk ?? false,
				};
				parent.postMessage({ event: 'follower:start', args: config });
				start();
			} else {
				parent.postMessage({ event: 'follower:stop' });
				stop();
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

			document.getElementById('player').value = args;
			break;
		case 'follower:stop':
			stop();
			break;
	}
});
