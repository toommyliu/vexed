import type { Bot } from './Bot';

/**
 * @remarks
 *
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
 */
export class Settings {
	/**
	 * Whether to automatically stop attacking a Counter Attack is active.
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
				this.bot.flash.call(() => swf.settingsInfiniteRange());
			}

			if (this.provokeMap) {
				this.bot.flash.call(() => swf.settingsProvokeMap());
			}

			if (this.provokeCell) {
				this.bot.flash.call(() => swf.settingsProvokeCell());
			}

			if (this.enemyMagnet) {
				this.bot.flash.call(() => swf.settingsEnemyMagnet());
			}

			if (this.skipCutscenes) {
				this.bot.flash.call(() => swf.settingsSkipCutscenes());
			}

			this.bot.flash.call(() => swf.settingsLagKiller(!this.lagKiller));

			this.bot.flash.call(() =>
				swf.settingsSetHidePlayers(this.hidePlayers),
			);

			if (this.walkSpeed !== 8) {
				this.bot.flash.call(() =>
					swf.settingsSetWalkSpeed(this.walkSpeed),
				);
			}
		}, 500);
	}

	/**
	 * Whether Infinite Range is enabled.
	 */
	public get infiniteRange(): boolean {
		return this.#infiniteRange;
	}

	/**
	 * Sets the state of Infinite Range.
	 *
	 * @param on - If true, enables Infinite Range. Otherwise, disables it.
	 */
	public set infiniteRange(on: boolean) {
		this.#infiniteRange = on;
		this.#updateOption(this.#optionInfiniteRange!, on);
	}

	/**
	 * Whether Provoke Map is enabled.
	 */
	public get provokeMap(): boolean {
		return this.#provokeMap;
	}

	/**
	 * Sets the state of Provoke Map.
	 *
	 * @param on - If true, enables Provoke Map. Otherwise, disables it.
	 */
	public set provokeMap(on: boolean) {
		this.#provokeMap = on;
		this.#updateOption(this.#optionProvokeMap!, on);
	}

	/**
	 * Whether Provoke Cell is enabled.
	 */
	public get provokeCell(): boolean {
		return this.#provokeCell;
	}

	/**
	 * Sets the state of Provoke Cell.
	 *
	 * @param on - If true, enables Provoke Cell. Otherwise, disables it.
	 */
	public set provokeCell(on: boolean) {
		this.#provokeCell = on;
		this.#updateOption(this.#optionProvokeCell!, on);
	}

	/**
	 * Whether Enemy Magnet is enabled.
	 */
	public get enemyMagnet(): boolean {
		return this.#enemyMagnet;
	}

	/**
	 * Sets the state of Enemy Magnet.
	 *
	 * @param on - If true, enables Enemy Magnet. Otherwise, disables it.
	 */
	public set enemyMagnet(on: boolean) {
		this.#enemyMagnet = on;
		this.#updateOption(this.#optionEnemyMagnet!, on);
	}

	/**
	 * Whether Lag Killer is enabled.
	 */
	public get lagKiller(): boolean {
		return this.#lagKiller;
	}

	/**
	 * Sets the state of Lag Killer.
	 *
	 * @param on - If true, enables Lag Killer. Otherwise, disables it.
	 */
	public set lagKiller(on: boolean) {
		this.#lagKiller = on;
		this.#updateOption(this.#optionLagKiller!, on);
	}

	/**
	 * Whether Hide Players is enabled.
	 */
	public get hidePlayers(): boolean {
		return this.#hidePlayers;
	}

	/**
	 * Sets the state of Hide Players.
	 *
	 * @param on - If true, enables Hide Players. Otherwise, disables it.
	 */
	public set hidePlayers(on: boolean) {
		this.#hidePlayers = on;
		this.#updateOption(this.#optionHidePlayers!, on);
	}

	/**
	 * Whether Skip Cutscenes is enabled.
	 */
	public get skipCutscenes(): boolean {
		return this.#skipCutscenes;
	}

	/**
	 * Sets the state of Skip Cutscenes.
	 *
	 * @param on - If true, enables Skip Cutscenes. Otherwise, disables it.
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
	 *
	 * @param speed - The walk speed.
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
	 * Sets the client target fps.
	 *
	 * @param fps - The target fps.
	 */
	public setFps(fps: number | string): void {
		this.bot.flash.set('stg.frameRate', Number.parseInt(String(fps), 10));
	}

	/**
	 * Sets the visibility of death ads.
	 *
	 * @param on - If true, shows death ads. Otherwise, they are hidden.
	 */
	public setDeathAds(on: boolean): void {
		this.bot.flash.set('userPreference.data.bDeathAd', on);
	}

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
