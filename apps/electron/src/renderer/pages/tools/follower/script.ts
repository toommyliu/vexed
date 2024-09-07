// @ts-expect-error
const parent = window.opener;

const disableInput = () => {
	(document.getElementById('player') as HTMLInputElement).disabled = true;
	(document.getElementById('skills') as HTMLInputElement).disabled = true;
	(document.getElementById('skill-wait') as HTMLInputElement).disabled = true;
	(document.getElementById('skill-delay') as HTMLInputElement).disabled =
		true;
	(document.getElementById('attack-priority') as HTMLInputElement).disabled =
		true;
	(document.getElementById('copy-walk') as HTMLInputElement).disabled = true;
	(document.getElementById('me') as HTMLInputElement).disabled = true;
};

const enableInput = () => {
	(document.getElementById('player') as HTMLInputElement).disabled = false;
	(document.getElementById('skills') as HTMLInputElement).disabled = false;
	(document.getElementById('skill-wait') as HTMLInputElement).disabled =
		false;
	(document.getElementById('skill-delay') as HTMLInputElement).disabled =
		false;
	(document.getElementById('attack-priority') as HTMLInputElement).disabled =
		false;
	(document.getElementById('copy-walk') as HTMLInputElement).disabled = false;
	(document.getElementById('me') as HTMLInputElement).disabled = false;
	if ((document.getElementById('start') as HTMLInputElement).checked) {
		(document.getElementById('start') as HTMLInputElement).checked = false;
	}
};

window.addEventListener('DOMContentLoaded', async () => {
	{
		const $btn = document.getElementById('me')!;
		$btn.addEventListener('click', () => {
			parent.postMessage({
				event: 'follower:me',
			});
		});
	}

	{
		const $btn = document.getElementById('start') as HTMLInputElement;
		$btn.addEventListener('click', () => {
			if ($btn.checked) {
				const player = (
					document.getElementById('player') as HTMLInputElement
				).value;
				const skills = (
					document.getElementById('skills') as HTMLInputElement
				).value;
				const wait = (
					document.getElementById('skill-wait') as HTMLInputElement
				).checked;
				const delay = (
					document.getElementById('skill-delay') as HTMLInputElement
				).value;
				const attackPriority = (
					document.getElementById(
						'attack-priority',
					) as HTMLInputElement
				).value;
				const copyWalk = (
					document.getElementById('copy-walk') as HTMLInputElement
				).checked;

				const config = {
					player,
					skills: skills.split(',').map((s: string) => s.trim()),
					skillWait: wait ?? false,
					skillDelay: delay ?? 150,
					attackPriority: attackPriority ?? [],
					copyWalk: copyWalk ?? false,
				};
				parent.postMessage({ event: 'follower:start', args: config });
				disableInput();
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

			(document.getElementById('player') as HTMLInputElement).value =
				args;
			break;
		case 'follower:stop':
			stop();
			break;
	}
});
