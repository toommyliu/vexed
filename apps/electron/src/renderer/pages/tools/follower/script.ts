// @ts-expect-error this is what we actually want
const parent = window.opener;

const disableInput = () => {
	(document.querySelector('#player') as HTMLInputElement).disabled = true;
	(document.querySelector('#skills') as HTMLInputElement).disabled = true;
	(document.querySelector('#skill-wait') as HTMLInputElement).disabled = true;
	(document.querySelector('#skill-delay') as HTMLInputElement).disabled =
		true;
	(document.querySelector('#attack-priority') as HTMLInputElement).disabled =
		true;
	(document.querySelector('#copy-walk') as HTMLInputElement).disabled = true;
	(document.querySelector('#me') as HTMLInputElement).disabled = true;
};

const enableInput = () => {
	(document.querySelector('#player') as HTMLInputElement).disabled = false;
	(document.querySelector('#skills') as HTMLInputElement).disabled = false;
	(document.querySelector('#skill-wait') as HTMLInputElement).disabled =
		false;
	(document.querySelector('#skill-delay') as HTMLInputElement).disabled =
		false;
	(document.querySelector('#attack-priority') as HTMLInputElement).disabled =
		false;
	(document.querySelector('#copy-walk') as HTMLInputElement).disabled = false;
	(document.querySelector('#me') as HTMLInputElement).disabled = false;
	if ((document.querySelector('#start') as HTMLInputElement).checked) {
		(document.querySelector('#start') as HTMLInputElement).checked = false;
	}
};

window.addEventListener('DOMContentLoaded', async () => {
	{
		const $btn = document.querySelector('#me')!;
		$btn.addEventListener('click', () => {
			parent.postMessage({
				event: 'follower:me',
			});
		});
	}

	{
		const $btn = document.querySelector('#start') as HTMLInputElement;
		$btn.addEventListener('click', () => {
			if ($btn.checked) {
				const player = (
					document.querySelector('#player') as HTMLInputElement
				).value;
				const skills = (
					document.querySelector('#skills') as HTMLInputElement
				).value;
				const wait = (
					document.querySelector('#skill-wait') as HTMLInputElement
				).checked;
				const delay = (
					document.querySelector('#skill-delay') as HTMLInputElement
				).value;
				const attackPriority = (
					document.querySelector(
						'#attack-priority',
					) as HTMLInputElement
				).value;
				const copyWalk = (
					document.querySelector('#copy-walk') as HTMLInputElement
				).checked;

				const config = {
					player,
					skills: skills.split(',').map((str: string) => str.trim()),
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

			(document.querySelector('#player') as HTMLInputElement).value =
				args;
			break;
		case 'follower:stop':
			stop();
			break;
	}
});
