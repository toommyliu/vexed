const parent = window.opener;

window.addEventListener('DOMContentLoaded', async () => {
	document.getElementById('me').addEventListener('click', () => {
		parent.postMessage({
			event: 'follower:me',
		});
	});
});

window.addEventListener('message', (ev) => {
	const {
		data: { event, args },
	} = ev;

	switch (event) {
		case 'follower:me':
			document.getElementById('player').value = args;
			break;
	}
});
