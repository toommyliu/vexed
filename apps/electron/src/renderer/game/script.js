var worker = new Worker('./worker.js');

var commands = [
	'join',
	'log',
	'join',
	'log',
	'join',
	'join'
];

worker.addEventListener('message', async (event) => {
	console.log('message from worker:', event.data);

	const cmd = event.data.event;

	if (cmd === 'join') {
		console.log('[game] joining a map');
		await new Promise((r) => setTimeout(r, 1000));
		console.log('[game] continuing');
	} else if (cmd === 'log') {
		console.log('[log] hello, continuing');
	}

	gotoNextCommand();
});

function start() {
	worker.postMessage({ event: 'start', commands });
}

function stop() {
	worker.postMessage({ event: 'stop' });
}

function gotoNextCommand() {
	worker.postMessage({ event: 'continue' });
}
