import type { AvatarData, MonsterData } from "@vexed/game";
import { Avatar, Monster, EntityState } from "@vexed/game";
import { interval } from "@vexed/utils";
import { doPriorityAttack } from "../util/doPriorityAttack";
import { extractMonsterMapId, isMonsterMapId } from "../util/isMonMapId";
import type { Bot } from "./Bot";
import { GameAction } from "./World";

const DEFAULT_KILL_OPTIONS: KillOptions = {
  killPriority: [],
  skillDelay: 150,
  skillSet: [1, 2, 3, 4],
  skillWait: false,
  skillAction: null,
};

function validateKillOptions(options: Partial<KillOptions> = {}): KillOptions {
  const out: KillOptions = {
    killPriority: DEFAULT_KILL_OPTIONS.killPriority,
    skillDelay: DEFAULT_KILL_OPTIONS.skillDelay,
    skillSet: DEFAULT_KILL_OPTIONS.skillSet,
    skillWait: DEFAULT_KILL_OPTIONS.skillWait,
    skillAction: DEFAULT_KILL_OPTIONS.skillAction,
  };

  // killPriority: allow string or string[]
  if (typeof options.killPriority === "string") {
    out.killPriority = options.killPriority;
  } else if (Array.isArray(options.killPriority)) {
    const ok = options.killPriority.every((value) => typeof value === "string");
    if (ok) out.killPriority = options.killPriority as string[];
  }

  // skillSet: must be non-empty array of integers between 0 and 5 (inclusive)
  if (Array.isArray(options.skillSet)) {
    const coerced = options.skillSet
      .map((num) => Number.parseInt(String(num), 10))
      .filter((num) => Number.isFinite(num) && num >= 0 && num <= 5);
    if (coerced.length > 0) out.skillSet = coerced;
  }

  // skillDelay: number >= 0
  if (
    typeof options.skillDelay === "number" &&
    Number.isFinite(options.skillDelay) &&
    options.skillDelay >= 0
  ) {
    out.skillDelay = options.skillDelay;
  }

  // skillWait: boolean
  if (typeof options.skillWait === "boolean") {
    out.skillWait = options.skillWait;
  }

  // skillAction: must be function or null
  if (options.skillAction === null) {
    out.skillAction = null;
  } else if (typeof options.skillAction === "function") {
    out.skillAction = options.skillAction as () => () => Promise<void>;
  }

  // signal: pass through only if it resembles an AbortSignal
  if (
    options.signal &&
    typeof (options.signal as AbortSignal).aborted === "boolean"
  ) {
    out.signal = options.signal;
  }

  return out;
}

/**
 * A `monsterResolvable` is either a monster name or monMapID prefixed with `id` and delimited by a `'`, `.`, `:`, `-` character.
 */
export class Combat {
  /**
   * Whether attacks are paused due to an active counter attack.
   */
  public pauseAttack: boolean = false;

  public constructor(public bot: Bot) {}

  /**
   * Whether the player has a target.
   */
  public hasTarget(): boolean {
    return Boolean(this.bot.flash.call<boolean>(() => swf.combatHasTarget()));
  }

  /**
   * Gets the target of the player.
   *
   * @returns The target of the player, or null if there is no target.
   */
  public get target(): Avatar | Monster | null {
    const target = this.bot.flash.call<AvatarData | MonsterData | null>(() =>
      swf.combatGetTarget(),
    );

    if (!target) {
      return null;
    }

    const monType = "type" in target ? (target.type as string) : null;
    if (!monType) {
      return null;
    }

    return monType === "monster"
      ? new Monster(target as MonsterData)
      : new Avatar(target as AvatarData);
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
    if (this.pauseAttack) {
      this.cancelAutoAttack();
      this.cancelTarget();
      return;
    }

    const idx = Number.parseInt(String(index), 10);

    if (idx < 0 || idx > 5) {
      return;
    }

    if (wait) {
      await this.bot.sleep(swf.combatGetSkillCooldownRemaining(idx));
    }

    if (force) {
      this.bot.flash.call(() => swf.combatForceUseSkill(idx));
    } else {
      this.bot.flash.call(() => swf.combatUseSkill(idx));
    }
  }

  public canUseSkill(index: number | string): boolean {
    const idx = Number.parseInt(String(index), 10);
    if (idx < 0 || idx > 5) {
      return false;
    }

    return this.bot.flash.call<boolean>(
      () => swf.combatGetSkillCooldownRemaining(idx) === 0,
    );
  }

  /**
   * Attacks a monster.
   *
   * @param monsterResolvable - The name or monMapID of the monster.
   */
  public attack(monsterResolvable: string): void {
    if (this.pauseAttack) {
      this.cancelAutoAttack();
      this.cancelTarget();
      return;
    }

    if (isMonsterMapId(monsterResolvable)) {
      const monMapId = Number.parseInt(
        extractMonsterMapId(monsterResolvable),
        10,
      );
      this.bot.flash.call(() => swf.combatAttackMonsterById(monMapId));
      return;
    }

    this.bot.flash.call(() => swf.combatAttackMonster(monsterResolvable));
  }

  /**
   * Cancels the current target.
   */
  public cancelTarget(): void {
    this.bot.flash.call(() => swf.combatCancelTarget());
  }

  /**
   * Cancels an auto attack.
   */
  public cancelAutoAttack(): void {
    this.bot.flash.call(() => swf.combatCancelAutoAttack());
  }

  /**
   * Kills a monster.
   *
   * @param monsterResolvable - The name or monMapId of the monster.
   * @param options - The optional configuration to use for the kill.
   * @example
   * // Basic usage
   * await combat.kill("Frogzard");
   *
   * // Advanced usage
   * // Kill Ultra Engineer, but prioritize attacking Defense Drone and Attack Drone first.
   * await combat.kill("Ultra Engineer", \{
   *     killPriority: ["Defense Drone", "Attack Drone"],
   *     skillSet: [5,3,2,1,4],
   *     skillDelay: 50,
   * \});
   */
  public async kill(
    monsterResolvable: string,
    options: Partial<KillOptions> = {},
  ): Promise<void> {
    if (!this.bot.player.isReady()) return;

    const opts: KillOptions = validateKillOptions(options);
    const {
      killPriority,
      skillSet,
      skillDelay,
      skillWait,
      skillAction,
      signal,
    } = opts;

    const _boundedSkillAction =
      typeof skillAction === "function"
        ? skillAction
            .bind({
              bot: this.bot,
            })() // the skillAction function
            .bind({
              bot: this.bot,
            }) // the returned function (the actual closure)
        : null;

    let skillIndex = 0;

    return new Promise<void>((resolve) => {
      let stopCombatInterval: (() => void) | null = null;
      let stopCheckInterval: (() => void) | null = null;
      let isResolved = false;

      const cleanup = async () => {
        if (stopCombatInterval) {
          stopCombatInterval();
          stopCombatInterval = null;
        }

        if (stopCheckInterval) {
          stopCheckInterval();
          stopCheckInterval = null;
        }

        this.cancelAutoAttack();
        this.cancelTarget();
      };

      // Combat logic
      void interval(async (_, stop) => {
        stopCombatInterval ??= stop;

        if (isResolved) {
          stop();
          return;
        }

        if (signal?.aborted) {
          isResolved = true;
          await cleanup();
          resolve();
          stop();
          return;
        }

        if (this.pauseAttack) {
          this.cancelAutoAttack();
          this.cancelTarget();
          await this.bot.waitUntil(() => !this.pauseAttack);
          return;
        }

        const _name = monsterResolvable.toLowerCase();
        if (
          _name === "escherion" &&
          this.bot.world.isMonsterAvailable("Staff of Inversion")
        ) {
          this.attack("Staff of Inversion");
        } else if (
          _name === "vath" &&
          this.bot.world.isMonsterAvailable("Stalagbite")
        ) {
          this.attack("Stalagbite");
        }

        const kp = Array.isArray(killPriority)
          ? killPriority
          : killPriority.split(",");
        doPriorityAttack(kp);

        if (!this.hasTarget()) {
          this.attack(monsterResolvable);
        }

        if (this.hasTarget()) {
          if (_boundedSkillAction) {
            try {
              await _boundedSkillAction();
            } catch {}
          } else {
            const skill = skillSet[skillIndex]!;
            skillIndex = (skillIndex + 1) % skillSet.length;

            await this.useSkill(String(skill), false, skillWait);
            await this.bot.sleep(skillDelay);
          }
        }
      }, 0);

      // Check logic
      void interval(async (_, stop) => {
        stopCheckInterval ??= stop;

        if (isResolved) {
          stop();
          return;
        }

        const isDead =
          this.bot.player.state === EntityState.Dead || !this.bot.player.alive;
        if (isDead) {
          await this.bot.waitUntil(
            () =>
              this.bot.player.isReady() &&
              (this.bot.player.state !== EntityState.Dead ||
                this.bot.player.alive),
            { timeout: 10_000 },
          );
          return;
        }

        const isIdle =
          this.bot.player.state === EntityState.Idle &&
          !this.bot.player.isAFK();
        const noTarget = !this.hasTarget();
        const shouldComplete = noTarget && isIdle && !this.pauseAttack;

        if (shouldComplete) {
          isResolved = true;
          await cleanup();
          resolve();
          stop();
        }
      }, 0);
    });
  }

  /**
   * Kills the monster until the quantity of the item is met in the inventory.
   *
   * @param monsterResolvable - The name or monMapID of the monster.
   * @param item - The name or ID of the item.
   * @param quantity - The quantity of the item.
   * @param options - The configuration to use for the kill.
   */
  public async killForItem(
    monsterResolvable: string,
    item: number | string,
    quantity: number,
    options: Partial<KillOptions> = {},
  ): Promise<void> {
    return this.#killForItem(monsterResolvable, item, quantity, false, options);
  }

  /**
   * Kills the monster until the quantity of the item is met in the temp inventory.
   *
   * @param monsterResolvable - The name or monMapID of the monster.
   * @param item - The name or ID of the item.
   * @param quantity - The quantity of the item.
   * @param options - The configuration to use for the kill.
   */
  public async killForTempItem(
    monsterResolvable: string,
    item: number | string,
    quantity: number,
    options: Partial<KillOptions> = {},
  ): Promise<void> {
    return this.#killForItem(monsterResolvable, item, quantity, true, options);
  }

  async #killForItem(
    monsterResolvable: string,
    item: number | string,
    quantity: number,
    isTemp = false,
    options: Partial<KillOptions> = {},
  ): Promise<void> {
    const opts: KillOptions = validateKillOptions(options);
    const store = isTemp ? this.bot.tempInventory : this.bot.inventory;

    const hasRequiredItems = () => store.contains(item, quantity);

    if (hasRequiredItems()) return;

    while (!hasRequiredItems()) {
      await this.kill(monsterResolvable, opts);

      if (!isTemp) {
        await this.bot.drops.pickup(item);
      }

      if (hasRequiredItems()) break;

      await this.bot.sleep(500);

      if (hasRequiredItems()) break;

      await this.bot.sleep(500);

      if (hasRequiredItems()) break;
    }

    await this.exit();
  }

  /**
   * Rests the player.
   *
   * @param full - Whether to rest until max hp and mp are reached.
   * @param exit - Whether to exit combat before attempting to rest.
   */
  public async rest(full = false, exit = false): Promise<void> {
    await this.bot.waitUntil(
      () =>
        this.bot.auth.isLoggedIn() &&
        this.bot.world.isActionAvailable(GameAction.Rest),
    );

    if (exit) {
      await this.exit();
    }

    swf.playerRest();

    if (full) {
      await this.bot.waitUntil(
        () =>
          this.bot.player.hp >= this.bot.player.maxHp &&
          this.bot.player.mp >= this.bot.player.maxMp,
      );
    }
  }

  /**
   * Exit from combat state.
   */
  public async exit(): Promise<boolean> {
    if (!this.bot.player.isInCombat()) return true;

    const ogProvokeCell = this.bot.settings.provokeCell;
    this.bot.settings.provokeCell = false;

    let success = false;

    try {
      if (!this.bot.player.isInCombat()) {
        success = true;
        return success;
      }

      await this.bot.world.jump(
        this.bot.player.cell,
        this.bot.player.pad,
        true,
      );

      const res_1 = await this.bot.waitUntil(
        () => !this.bot.player.isInCombat(),
        {
          timeout: 2_000,
        },
      );
      if (res_1.isOk()) {
        success = true;
        return success;
      }

      const ogCell = this.bot.player.cell;

      const cellsWithMonsters = new Set(
        this.bot.world.monsters
          .all()
          .values()
          .map((mon) => mon.cell.toLowerCase()),
      );
      const cells = this.bot.world.cells
        .filter(
          (cell) =>
            cell !== ogCell &&
            cell.toLowerCase() !== "blank" &&
            !/^cell\d+$/i.test(cell), // Cell1, Cell2, etc.
        )
        .sort((a, b) => {
          const aHasMonsters = cellsWithMonsters.has(a.toLowerCase());
          const bHasMonsters = cellsWithMonsters.has(b.toLowerCase());
          if (aHasMonsters === bHasMonsters) return 0;
          return aHasMonsters ? 1 : -1;
        });

      for (const cell of cells) {
        await this.bot.world.jump(cell);

        const res_2 = await this.bot.waitUntil(
          () => !this.bot.player.isInCombat(),
        );
        if (res_2.isOk()) {
          success = true;
          break;
        }
      }

      if (!success && this.bot.player.isInCombat()) {
        await this.bot.world.jump(ogCell);

        const res_3 = await this.bot.waitUntil(
          () => !this.bot.player.isInCombat(),
        );
        success = res_3.isOk();
      }

      return success;
    } finally {
      await this.bot.sleep(500);
      this.bot.settings.provokeCell = ogProvokeCell;
    }
  }
}

export type KillOptions = {
  /**
   * An ascending list of monster names or monMapIDs to kill. This can also be a string of monsterResolvables deliminted by a comma.
   */
  killPriority: string[] | string;
  /**
   * Optional AbortSignal that can be used to abort the kill operation early.
   * When the signal is aborted, the kill method will immediately stop and resolve.
   */
  signal?: AbortSignal;
  /**
   *  Custom skill action function that provides alternative combat logic. It should be implemented as a closure that returns an async function. When provided, this function replaces the default skill rotation logic. The outer and inner functions are bound with `bot` context. Skill logic should be implemented in the inner function.
   */
  skillAction: (() => () => Promise<void>) | null;
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
