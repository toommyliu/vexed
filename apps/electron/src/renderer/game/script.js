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

	const options = document.querySelectorAll('[id^="option-"]');
	for (const option of options) {
		if (option.tagName === 'INPUT') {
			return;
		}

		option.addEventListener('click', () => {
			const checked = option.getAttribute('data-checked') === 'true';

			option.setAttribute('data-checked', checked ? 'false' : 'true');
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
	}
});

window.addEventListener('click', (ev) => {
	mapping.forEach((el, key) => {
		if (ev.target.id === key) {
			el.classList.toggle('w3-show');
		} else {
			el.classList.remove('w3-show');
		}
	});
});
