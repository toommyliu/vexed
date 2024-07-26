/**
 * @type {import('./botting/api/Bot')}
 */
const bot = Bot.getInstance();
const { settings } = bot;

const mapping = new Map();

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
			window.open('./pages/tools/fast-travels/index.html', null, 'width=520,height=524');
		});
	}
	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(2)',
		);
		btn.addEventListener('click', () => {
			window.open('./pages/tools/loader-grabber.html', null);
		});
	}
	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(3)',
		);
		btn.addEventListener('click', () => {
			window.open('./pages/tools/follower.html', null);
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

window.onmessage = async (ev) => {
	const {
		data: { event, args },
	} = ev;

	switch (event) {
		//#region fast travel
		case 'fast-travel':
			await bot.world.join(`${args.map}-${args.roomNumber}`, args.cell ?? 'Enter', args.pad ?? 'Spawn', 1);
			break;
		//#endregion
	}
};
