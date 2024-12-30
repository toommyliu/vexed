import type { Bot } from './Bot';

/**
 * `Provoke Map`: If enabled, tags all monsters in the map.
 *
 * `Provoke Cell`: If enabled, tags all monsters in the current cell.
 *
 * `Enemy Magnet`: If enabled, sets the target's position to that of the player.
 *
 * `Lag Killer`: If enabled, disables rendering of most UI elements.
 *
 * `Hide Players`: If enabled, hides other players.
 *
 * `Skip Cutscenes:` If enabled, skips cutscenes as needed.
 *
 * `Walk Speed`: The player's walk speed.
 *
 * Settings are updated in a background interval every 500ms.
 *
 */
export class Settings {
	/**
	 * Whether to automatically stop attacking when the monster is countering.
	 */
	public counterAttack = false;

	#infiniteRange = false;

	#provokeMap = false;

	#provokeCell = false;

	#enemyMagnet = false;

	#lagKiller = false;

	#hidePlayers = false;

	#skipCutscenes = false;

	#walkSpeed = 8;

	#optionInfiniteRange: HTMLElement | null = null;

	#optionProvokeMap: HTMLElement | null = null;

	#optionProvokeCell: HTMLElement | null = null;

	#optionEnemyMagnet: HTMLElement | null = null;

	#optionLagKiller: HTMLElement | null = null;

	#optionHidePlayers: HTMLElement | null = null;

	#optionSkipCutscenes: HTMLElement | null = null;

	#optionWalkSpeed: HTMLElement | null = null;

	public constructor(public bot: Bot) {
		this.#optionInfiniteRange = document.querySelector(
			'#option-infinite-range',
		);
		this.#optionProvokeMap = document.querySelector('#option-provoke-map');
		this.#optionProvokeCell = document.querySelector(
			'#option-provoke-cell',
		);
		this.#optionEnemyMagnet = document.querySelector(
			'#option-enemy-magnet',
		);
		this.#optionLagKiller = document.querySelector('#option-lag-killer');
		this.#optionHidePlayers = document.querySelector(
			'#option-hide-players',
		);
		this.#optionSkipCutscenes = document.querySelector(
			'#option-skip-cutscenes',
		);
		this.#optionWalkSpeed = document.querySelector('#option-walkspeed');

		this.bot.timerManager.setInterval(() => {
			if (!this.bot.player.isReady()) {
				return;
			}

			if (this.infiniteRange) {
				this.bot.flash.call(() => swf.SetInfiniteRange());
			}

			if (this.provokeMap && this.bot.world.monsters.length > 0) {
				const ids = this.bot.world.monsters.map((mon) => mon.MonMapID);
				this.bot.packets.sendServer(
					`%xt%zm%aggroMon%${this.bot.world.roomId}%${ids.join('%')}%`,
				);
			}

			if (this.provokeCell) {
				this.bot.flash.call(() => swf.SetProvokeMonsters());
			}

			if (this.enemyMagnet) {
				this.bot.flash.call(() => swf.SetEnemyMagnet());
			}

			if (this.skipCutscenes) {
				this.bot.flash.call(() => swf.SetSkipCutscenes());
			}

			this.bot.flash.call(() =>
				swf.SetLagKiller(this.lagKiller ? 'True' : 'False'),
			);

			this.bot.flash.call(() => swf.HidePlayers(this.hidePlayers));

			if (this.walkSpeed !== 8) {
				this.bot.flash.call(() =>
					swf.SetWalkSpeed(String(this.walkSpeed)),
				);
			}
		}, 500);
	}

	/**
	 * The state of "Infinite Range".
	 */
	public get infiniteRange(): boolean {
		return this.#infiniteRange;
	}

	/**
	 * Sets state of "Infinite Range".
	 *
	 */
	public set infiniteRange(on: boolean) {
		this.#infiniteRange = on;
		this.#updateOption(this.#optionInfiniteRange!, on);
	}

	/**
	 * The state of "Provoke Map".
	 */
	public get provokeMap(): boolean {
		return this.#provokeMap;
	}

	/**
	 * Sets state of "Provoke Map".
	 */
	public set provokeMap(on: boolean) {
		this.#provokeMap = on;
		this.#updateOption(this.#optionProvokeMap!, on);
	}

	/**
	 * The state of "Provoke Cell".
	 */
	public get provokeCell(): boolean {
		return this.#provokeCell;
	}

	/**
	 * Sets state of "Provoke Cell".
	 */
	public set provokeCell(on: boolean) {
		this.#provokeCell = on;
		this.#updateOption(this.#optionProvokeCell!, on);
	}

	/**
	 * The state of "Enemy Magnet".
	 */
	public get enemyMagnet(): boolean {
		return this.#enemyMagnet;
	}

	/**
	 * Sets state of "Enemy Magnet".
	 */
	public set enemyMagnet(on: boolean) {
		this.#enemyMagnet = on;
		this.#updateOption(this.#optionEnemyMagnet!, on);
	}

	/**
	 * Whether "Lag Killer" is enabled.
	 */
	public get lagKiller(): boolean {
		return this.#lagKiller;
	}

	/**
	 * Sets state of "Lag Killer".
	 */
	public set lagKiller(on: boolean) {
		this.#lagKiller = on;
		this.#updateOption(this.#optionLagKiller!, on);
		// Call immediately
		if (on) {
			this.bot.flash.call(() => swf.SetLagKiller('True'));
		} else {
			this.bot.flash.call(() => swf.SetLagKiller('False'));
		}
	}

	/**
	 * Whether "Hide Players" is enabled.
	 */
	public get hidePlayers(): boolean {
		return this.#hidePlayers;
	}

	/**
	 * Sets state of "Hide Players".
	 */
	public set hidePlayers(on: boolean) {
		this.#hidePlayers = on;
		this.#updateOption(this.#optionHidePlayers!, on);
		this.bot.flash.call(() => swf.HidePlayers(this.#hidePlayers));
	}

	/**
	 * Whether "Skip Cutscenes" is enabled.
	 */
	public get skipCutscenes(): boolean {
		return this.#skipCutscenes;
	}

	/**
	 * Sets state of "Skip Cutscenes".
	 */
	public set skipCutscenes(on: boolean) {
		this.#skipCutscenes = on;
		this.#updateOption(this.#optionSkipCutscenes!, on);
	}

	/**
	 * The player's walk speed.
	 */
	public get walkSpeed(): number {
		return this.#walkSpeed;
	}

	/**
	 * Sets the player's walk speed.
	 */
	public set walkSpeed(speed: number | number) {
		if (typeof speed === 'number') {
			const val = Math.max(0, Math.min(99, speed));
			this.#walkSpeed = val;
			this.#updateOption(this.#optionWalkSpeed!, val);
		} else if (typeof speed === 'string') {
			const val = Number.parseInt(speed, 10);
			const tmp = Number.isNaN(val) ? 8 : Math.max(0, Math.min(99, val));
			this.#walkSpeed = tmp;
			this.#updateOption(this.#optionWalkSpeed!, tmp);
		}
	}

	/**
	 * Sets the target client FPS.
	 *
	 * @param fps - The target fps.
	 */
	public setFPS(fps: number | string): void {
		this.bot.flash.call(() => swf.SetFPS(String(fps)));
	}

	/**
	 * Sets the visiblity of death ads.
	 *
	 * @param on - If enabled, death ads are shown.
	 */
	public setDeathAds(on: boolean): void {
		this.bot.flash.set('userPreference.data.bDeathAd', on);
	}

	/**
	 * Updates an option state in the ui.
	 */
	#updateOption(option: HTMLElement, value: boolean | number | string): void {
		switch (option.tagName) {
			case 'INPUT':
				(option as HTMLInputElement).value = String(value);
				break;
			case 'BUTTON':
				option.setAttribute('data-checked', value ? 'true' : 'false');
				option.classList.toggle('option-active', Boolean(value));
				break;
		}
	}
}
