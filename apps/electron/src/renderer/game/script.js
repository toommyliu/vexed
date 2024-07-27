/**
 * @type {import('./botting/api/Bot')}
 */
const bot = Bot.getInstance();
const { settings } = bot;

const mapping = new Map();

window.windows = {
	game: this,
	tools: { fastTravels: null, loaderGrabber: null, follower: null },
	packets: { logger: null, spammer: null },
};

window.addEventListener('DOMContentLoaded', async () => {
	const keys = ['scripts', 'tools', 'packets', 'options'];
	for (const k of keys) {
		mapping.set(k, document.getElementById(`${k}-dropdowncontent`));
	}

	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(1)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.tools.fastTravels) {
				window.windows.tools.fastTravels.show();
			} else {
				window.windows.tools.fastTravels = window.open(
					'./pages/tools/fast-travels/index.html',
					null,
					'width=520,height=524',
				);
			}
		});
	}
	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(2)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.tools.loaderGrabber) {
				window.windows.tools.loaderGrabber.show();
			} else {
				window.windows.tools.loaderGrabber = window.open(
					'./pages/tools/loader-grabber/index.html',
					null,
				);
			}
		});
	}
	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(3)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.tools.follower) {
				window.windows.tools.follower.show();
			} else {
				window.windows.tools.follower = window.open(
					'./pages/tools/follower/index.html',
					null,
				);
			}
		});
	}

	{
		const btn = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(1)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.packets.logger) {
				window.windows.packets.logger.show();
			} else {
				window.windows.packets.logger = window.open(
					'./pages/packets/logger/index.html',
					null,
				);
			}
		});
	}

	{
		const btn = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(2)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.packets.spammer) {
				window.windows.packets.spammer.show();
			} else {
				window.windows.packets.spammer = window.open(
					'./pages/packets/spammer/index.html',
					null,
				);
			}
		});
	}

	const options = document.querySelectorAll('[id^="option-"]');
	for (const option of options) {
		switch (option.tagName) {
			case 'INPUT':
				option.addEventListener('change', (ev) => {
					settings.walkSpeed = ev.target.value;
				});
				break;
			case 'BUTTON':
				option.addEventListener('click', () => {
					const checked =
						option.getAttribute('data-checked') === 'true';
					option.setAttribute(
						'data-checked',
						checked ? 'false' : 'true',
					);
					option.querySelector('.checkmark').style.display = checked
						? 'none'
						: 'block';

					switch (option.textContent.trim()) {
						case 'Infinite Range':
							settings.infiniteRange = !checked;
							break;
						case 'Provoke Map':
							settings.provokeMap = !checked;
							break;
						case 'Provoke Cell':
							settings.provokeCell = !checked;
							break;
						case 'Enemy Magnet':
							settings.enemyMagnet = !checked;
							break;
						case 'Lag Killer':
							settings.lagKiller = !checked;
							break;
						case 'Hide Players':
							settings.hidePlayers = !checked;
							break;
						case 'Skip Cutscenes':
							settings.skipCutscenes = !checked;
							break;
					}
				});
				break;
		}
	}
});

window.addEventListener('click', (ev) => {
	mapping.forEach((el, key) => {
		if (ev.target.id === key) {
			// Show the selected dropdown
			el.classList.toggle('w3-show');
		} else {
			// Hide the other dropdowns
			el.classList.remove('w3-show');
		}
	});
});

/**
 * @param {Event} ev
 */
window.onmessage = async (ev) => {
	const {
		data: { event, args },
	} = ev;

	switch (event) {
		//#region fast travel
		case 'fast-travel':
			await bot.world.join(
				`${args.map}-${args.roomNumber}`,
				args.cell ?? 'Enter',
				args.pad ?? 'Spawn',
				1,
			);
			break;
		//#endregion
		// #region loader grabber
		//#endregion
		//#region follower
		case 'follower:me':
			ev.source.postMessage({
				event: 'follower:me',
				args: bot.auth.username,
			});
			break;
		//#endregion
	}
};
