import merge from 'lodash.merge';
import type { Bot } from './Bot';
import { PlayerState } from './Player';
import { GameAction } from './World';
import type { SetIntervalAsyncTimer } from './util/TimerManager';
import { isMonsterMapId } from './util/utils';

const DEFAULT_KILL_OPTIONS: KillOptions = {
	killPriority: [],
	skillDelay: 150,
	skillSet: [1, 2, 3, 4],
	skillWait: false,
};

/**
 * A `monsterResolvable` is either a monster name or monMapID prefixed with `id` and delimited by a `'`, `.`, `:`, `-` character.
 */
export class Combat {
	public pauseAttack: boolean = false;

	public constructor(public bot: Bot) {}

	/**
	 * Whether the player has a target.
	 */
	public hasTarget(): boolean {
		return Boolean(this.bot.flash.call<boolean>(() => swf.HasTarget()));
	}

	/**
	 * Returns information about the target.
	 */
	public get target(): Record<string, unknown> | null {
		if (this.hasTarget()) {
			const objData = this.bot.flash.get(
				'world.myAvatar.target.objData',
				true,
			);
			const dataLeaf = this.bot.flash.get(
				'world.myAvatar.target.dataLeaf',
				true,
			);

			const ret: TargetInfo = {
				name: objData.strMonName ?? objData.strUsername,
				hp: dataLeaf.intHP,
				maxHP: dataLeaf.intHPMax,
				cell: dataLeaf.strFrame,
				level: dataLeaf.iLvl ?? dataLeaf.intLevel,
				state: dataLeaf.intState,
			};

			if (dataLeaf.entType === 'p') {
				ret.monId = dataLeaf.MonID;
				ret.monMapId = dataLeaf.MonMapID;
			}

			return ret;
		}

		return null;
	}

	/**
	 * Casts a skill.
	 *
	 * @param index - The index of the skill. Skills range from 0 (skill 1) to 5 (potions).
	 * @param force - Whether to use the skill regardless if there is a target.
	 * @param wait - Whether to wait for the skill to be available.
	 */
	public async useSkill(
		index: number | string,
		force = false,
		wait = false,
	): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		const fn = force ? swf.ForceUseSkill : swf.UseSkill;
		// eslint-disable-next-line no-param-reassign
		index = String(index);
		if (wait) {
			await this.bot.sleep(swf.SkillAvailable(index));
		}

		fn(index);
	}

	/**
	 * Attacks a monster.
	 *
	 * @param monsterResolvable - The name or monMapID of the monster.
	 */
	public attack(monsterResolvable: string): void {
		if (isMonsterMapId(monsterResolvable)) {
			const monMapId = monsterResolvable.slice(3);
			this.bot.flash.call(() => swf.AttackMonsterByMonMapId(monMapId));
			return;
		}

		this.bot.flash.call(() => swf.AttackMonster(monsterResolvable));
	}

	/**
	 * Cancels the current target.
	 */
	public cancelTarget(): void {
		this.bot.flash.call(() => swf.CancelTarget());
	}

	/**
	 * Cancels an auto attack.
	 */
	public cancelAutoAttack(): void {
		this.bot.flash.call(() => swf.CancelAutoAttack());
	}

	/**
	 * Kills a monster.
	 *
	 * @param monsterResolvable - The name or monMapID of the monster.
	 * @param options - The configuration to use for the kill.
	 */
	public async kill(
		monsterResolvable: string,
		options: Partial<KillOptions> = {},
	): Promise<void> {
		await this.bot.waitUntil(
			() => this.bot.world.isMonsterAvailable(monsterResolvable),
			null,
			3,
		);

		if (!this.bot.player.isReady()) {
			return;
		}

		const opts = merge({}, DEFAULT_KILL_OPTIONS, options);

		const { killPriority, skillSet, skillDelay, skillWait } = opts;

		let timer_a: SetIntervalAsyncTimer<unknown[]> | null = null;
		let timer_b: SetIntervalAsyncTimer<unknown[]> | null = null;

		const index = 0;

		return new Promise<void>((resolve) => {
			timer_a = this.bot.timerManager.setInterval(async () => {
				if (this.pauseAttack) {
					return;
				}

				const _name = monsterResolvable.toLowerCase();
				if (
					_name === 'escherion' &&
					this.bot.world.isMonsterAvailable('Staff of Inversion')
				) {
					this.attack('Staff of Inversion');
				} else if (
					_name === 'vath' &&
					this.bot.world.isMonsterAvailable('Stalagbite')
				) {
					this.attack('Stalagbite');
				}

				let kp;
				if (typeof killPriority === 'string') {
					kp = killPriority.split(',');
				} else if (Array.isArray(killPriority)) {
					kp = killPriority;
				}

				if (kp!.length > 0) {
					for (const _kp of kp!) {
						if (this.bot.world.isMonsterAvailable(_kp)) {
							this.attack(_kp);
							break;
						}
					}
				}

				if (!this.hasTarget()) {
					this.attack(monsterResolvable);
				}

				if (this.hasTarget()) {
					if (skillWait) {
						await this.bot.sleep(
							this.bot.flash.call(() =>
								swf.SkillAvailable(String(skillSet[index]!)),
							),
						);
					}

					await this.useSkill(
						String(skillSet[(index + 1) % skillSet.length]),
					);
					await this.bot.sleep(skillDelay);
				}
			}, 0);

			this.bot.timerManager.setTimeout(() => {
				timer_b = this.bot.timerManager.setInterval(async () => {
					// TODO: improve kill detection
					if (
						(!this.hasTarget() ||
							(this.bot.player.state === PlayerState.Idle &&
								!this.bot.player.isAFK())) &&
						!this.pauseAttack
					) {
						await this.bot.timerManager.clearInterval(timer_a!);
						await this.bot.timerManager.clearInterval(timer_b!);

						// await this.exit();

						resolve();
					}
				}, 0);
			}, opts.skillDelay!);
		});
	}

	/**
	 * Kills the monster until the expected quantity of the item is collected in the Inventory.
	 *
	 * @param monsterResolvable - The name or monMapID of the monster.
	 * @param itemName - The name or ID of the item.
	 * @param targetQty - The quantity of the item.
	 * @param options - The configuration to use for the kill.
	 */
	public async killForItem(
		monsterResolvable: string,
		itemName: string,
		targetQty: number,
		options: Partial<KillOptions> = {},
	): Promise<void> {
		return this.#killForItem(
			monsterResolvable,
			itemName,
			targetQty,
			false,
			options,
		);
	}

	/**
	 * Kills the monster until the expected quantity of the item is collected in the Temp Inventory.
	 *
	 * @param monsterResolvable - The name or monMapID of the monster.
	 * @param itemName - The name or ID of the item.
	 * @param targetQty - The quantity of the item.
	 * @param options - The configuration to use for the kill.
	 */
	public async killForTempItem(
		monsterResolvable: string,
		itemName: string,
		targetQty: number,
		options: Partial<KillOptions> = {},
	): Promise<void> {
		return this.#killForItem(
			monsterResolvable,
			itemName,
			targetQty,
			true,
			options,
		);
	}

	/**
	 * Rests the player.
	 *
	 * @param full - Whether to rest until max hp and mp are reached.
	 * @param exit - Whether to exit combat before attempting to rest.
	 */
	public async rest(full = false, exit = false): Promise<void> {
		await this.bot.waitUntil(
			() => this.bot.world.isActionAvailable(GameAction.Rest),
			() => this.bot.auth.isLoggedIn(),
		);

		if (exit) {
			await this.exit();
		}

		swf.Rest();

		if (full) {
			await this.bot.waitUntil(
				() =>
					this.bot.player.hp >= this.bot.player.maxHP &&
					this.bot.player.mp >= this.bot.player.maxMP,
			);
		}
	}

	/**
	 * Kills the monster until the expected quantity of the item is collected in given store.
	 *
	 * @param monsterResolvable - The name or monMapID of the monster.
	 * @param itemName - The name or ID of the item.
	 * @param targetQty - The quantity of the item.
	 * @param isTemp - Whether the item is in the temp inventory.
	 * @param options - The configuration to use for the kill.
	 */
	async #killForItem(
		monsterResolvable: string,
		itemName: string,
		targetQty: number,
		isTemp = false,
		options: Partial<KillOptions> = {},
	): Promise<void> {
		const opts = merge({}, DEFAULT_KILL_OPTIONS, options);

		const store = isTemp ? this.bot.tempInventory : this.bot.inventory;
		const shouldExit = () => store.contains(itemName, targetQty);

		while (!shouldExit()) {
			await this.kill(monsterResolvable, opts);
			await this.bot.sleep(500);

			if (!isTemp) {
				await this.bot.drops.pickup(itemName);
			}
		}

		await this.exit();
	}

	/**
	 * Attempts to exit from combat.
	 *
	 */
	public async exit(): Promise<void> {
		while (this.bot.player.state === PlayerState.InCombat) {
			this.cancelTarget();
			this.cancelAutoAttack();

			await this.bot.world.jump(
				this.bot.player.cell,
				this.bot.player.pad,
				true,
			);
			await this.bot.waitUntil(
				() => this.bot.player.state !== PlayerState.InCombat,
			);
			await this.bot.sleep(1_000);
		}
	}
}

export type TargetInfo = {
	/**
	 * The cell the target is in.
	 */
	cell: string;
	/**
	 * The hp of the target.
	 */
	hp: number;
	/**
	 * The level of the target.
	 */
	level: number;
	/**
	 * The max hp of the target.
	 */
	maxHP: number;
	/**
	 * The monster id of the target.
	 */
	monId?: number;
	/**
	 * The monster map id of the target.
	 */
	monMapId?: string;
	/**
	 * The name of the target.
	 */
	name: string;
	/**
	 * The state of the target.
	 */
	state: number;
};

export type KillOptions = {
	/**
	 * An ascending list of monster names or monMapIDs to kill. This can also be a string of monsterResolvables deliminted by a comma.
	 */
	killPriority: string[] | string;
	/**
	 * The delay between each skill cast.
	 */
	skillDelay: number;
	/**
	 * The order of skills to use.
	 */
	skillSet: number[];
	/**
	 * Whether to wait for the skill to be available before casting.
	 */
	skillWait: boolean;
};