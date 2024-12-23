// Script for managing topnav interactivity
import { ipcRenderer } from 'electron/renderer';
import { IPC_EVENTS } from '../../common/ipc-events';

const dropdowns = new Map<string, HTMLElement>();
const optionStates = new Map<string, boolean>();

const checkmarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

window.addEventListener('DOMContentLoaded', async () => {
	dropdowns.set(
		'scripts',
		document.querySelector('#scripts-dropdowncontent')!,
	);
	dropdowns.set('tools', document.querySelector('#tools-dropdowncontent')!);
	dropdowns.set(
		'packets',
		document.querySelector('#packets-dropdowncontent')!,
	);
	dropdowns.set(
		'options',
		document.querySelector('#options-dropdowncontent')!,
	);

	{
		const btn = document.querySelector(
			'#scripts-dropdowncontent > button:nth-child(1)',
		) as HTMLButtonElement;
		btn.addEventListener('click', async () => {
			const scriptBody = await ipcRenderer.invoke(IPC_EVENTS.LOAD_SCRIPT);
			if (!scriptBody) {
				return;
			}

			document.querySelector('#loaded-script')?.remove();

			const b64_out = Buffer.from(scriptBody, 'base64').toString('utf8');

			const scriptContent = `
			(async () => {
				const getTimestamp = () => '[' + new Date().toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: true
				}) + ']';

				const consoleProxy = new Proxy(console, {
					get(target, prop) {
						if (typeof target[prop] === 'function') {
							return (...args) => target[prop](getTimestamp(), ...args);
						}
						return target[prop];
					}
				});

				const script = new Function('console', 'bot', \`
					(async () => {
						try {
							console.log('Script started');
							while (!bot.player.isReady()) await bot.sleep(1000);
							bot._start();

							const abortPromise = new Promise((_, reject) => {
								bot.signal.addEventListener('abort', () => {
									reject(new Error('Script aborted.'));
								});
							});

							await Promise.race([
								(async () => { ${b64_out} })(),
								abortPromise
							]);

							console.log('Script finished');
						} catch (error) {
							if (error.message === 'Script aborted.') {
								console.log('Script execution has stopped.');
							} else {
								console.error('An error occurred while executing the script:', error);
							}
						}
					})();
				\`);

				await script(consoleProxy, bot);
			})();
			//# sourceURL=script.ui.ts
			`;

			const blob = new Blob([scriptContent], { type: 'application/javascript' });
			const scriptUrl = URL.createObjectURL(blob);

			const script = document.createElement('script');
			script.type = 'module';
			script.id = 'loaded-script';
			script.src = scriptUrl;

			document.body.appendChild(script);
		});
	}

	{
		const btn = document.querySelector(
			'#scripts-dropdowncontent > button:nth-child(2)',
		) as HTMLButtonElement;
		btn.addEventListener('click', () => {
			ipcRenderer.send(IPC_EVENTS.TOGGLE_DEV_TOOLS);
		});
	}

	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(1)',
		) as HTMLButtonElement;
		btn.addEventListener('click', () => {});
	}

	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(2)',
		) as HTMLButtonElement;
		btn.addEventListener('click', () => {});
	}

	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(3)',
		) as HTMLButtonElement;
		btn.addEventListener('click', () => {});
	}

	{
		const btn = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(1)',
		) as HTMLButtonElement;
		btn.addEventListener('click', () => {});
	}

	{
		const btn = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(2)',
		) as HTMLButtonElement;
		btn.addEventListener('click', () => {});
	}

	{
		let lastRoomId: number | null;

		const el_cells = document.querySelector('#cells') as HTMLSelectElement;
		const el_pads = document.querySelector('#pads') as HTMLSelectElement;
		const el_x = document.querySelector('#x') as HTMLButtonElement;

		const updateSelectMenus = (forceUpdate: boolean = false) => {
			if (!bot.player.isReady()) return;

			if (!forceUpdate && lastRoomId === bot.world.roomId) {
				return;
			}

			el_cells.innerHTML = '';

			for (const cell of bot.world.cells) {
				const option = document.createElement('option');
				option.value = cell;
				option.text = cell;
				el_cells.appendChild(option);
			}

			el_cells.value = bot.player.cell ?? 'Enter';
			el_pads.value = bot.player.pad ?? 'Spawn';

			lastRoomId = bot.world.roomId;
		};

		const jumpToCell = () => {
			const _cell = el_cells.value ?? 'Enter';
			const _pad = el_pads.value ?? 'Spawn';

			bot.flash.call(() => swf.Jump(_cell, _pad));
		};

		el_cells.addEventListener('mousedown', (ev) => {
			// Prevent the select from closing
			ev.stopPropagation();
			updateSelectMenus();
		});
		el_cells.addEventListener('change', jumpToCell);

		el_pads.addEventListener('mousedown', (ev) => {
			// Prevent the select from closing
			ev.stopPropagation();
			updateSelectMenus();
		});
		el_pads.addEventListener('change', jumpToCell);

		el_x.addEventListener('click', () => updateSelectMenus(true));
	}

	{
		const btn = document.querySelector('#bank') as HTMLButtonElement;
		btn.addEventListener('click', async () => {
			if (!bot.player.isReady()) return;

			if (bot.bank.isOpen()) {
				swf.ShowBank();
			} else {
				await bot.bank.open();
			}
		});
	}

	{
		// Add checkmarks to options
		const optionButtons = document.querySelectorAll('[id^="option-"]');
		optionButtons.forEach((button) => {
			if (button.id === 'option-walkspeed') return;

			const checkmark = document.createElement('div');
			checkmark.className = 'option-checkmark';
			checkmark.innerHTML = checkmarkSvg;
			button.appendChild(checkmark);

			button.addEventListener('click', (e) => {
				e.stopPropagation();
				const state = !optionStates.get(button.id);
				optionStates.set(button.id, state);
				button.classList.toggle('option-active', state);
			});
		});
	}
});

window.addEventListener('click', (ev) => {
	const target = ev.target as HTMLElement;
	const optionsDropdown = document.querySelector('#options-dropdowncontent');

	for (const [key, el] of dropdowns.entries()) {
		if (target.id === key) {
			// Show the clicked dropdown
			el.classList.toggle('w3-show');
		} else if (
			target.id !== 'option-walkspeed' &&
			!(
				optionsDropdown?.contains(target) &&
				target.closest('[id^="option-"]')
			)
		) {
			// Hide other dropdowns, except when clicking an option
			el.classList.remove('w3-show');
		}
	}
});

window.addEventListener('mousedown', (ev) => {
	// Close all dropdowns when focusing the game
	if ((ev.target as HTMLElement).id === 'swf') {
		for (const el of dropdowns.values()) {
			el.classList.remove('w3-show');
		}
	}
});

window.addEventListener('keydown', (ev) => {
	// Allow certain shortcuts while the game is focused
	if (
		(ev.ctrlKey /* ctrl */ || ev.metaKey) /* cmd */ &&
		(ev.target as HTMLElement).id === 'swf'
	) {
		switch (ev.key.toLowerCase()) {
			case 'w':
			case 'q':
				window.close();
				break;
			case 'r':
				if (ev.shiftKey) {
					window.location.reload();
				}

				break;
		}
	}
});
