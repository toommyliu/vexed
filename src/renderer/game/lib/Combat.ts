import merge from "lodash.merge";
import { interval } from "../../../common/interval";
import { doPriorityAttack } from "../util/doPriorityAttack";
import { exitFromCombat } from "../util/exitFromCombat";
import { isMonsterMapId } from "../util/isMonMapId";
import type { Bot } from "./Bot";
import { PlayerState } from "./Player";
import { GameAction } from "./World";

const DEFAULT_KILL_OPTIONS: KillOptions = {
  killPriority: [],
  skillDelay: 150,
  skillSet: [1, 2, 3, 4],
  skillWait: false,
  skillAction: null,
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
    return Boolean(this.bot.flash.call<boolean>(() => swf.combatHasTarget()));
  }

  /**
   * Returns information about the target.
   */
  public get target(): Record<string, unknown> | null {
    if (this.hasTarget()) {
      const objData = this.bot.flash.get("world.myAvatar.target.objData", true);
      const dataLeaf = this.bot.flash.get(
        "world.myAvatar.target.dataLeaf",
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

      if (dataLeaf.entType === "p") {
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
    if (this.pauseAttack) {
      this.cancelAutoAttack();
      this.cancelTarget();
      return;
    }

    const idx = Number.parseInt(String(index), 10);
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
    return this.bot.flash.call<boolean>(() => swf.combatCanUseSkill(idx));
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
      const monMapId = Number.parseInt(monsterResolvable.slice(3), 10);
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
   *   killPriority: ["Defense Drone", "Attack Drone"],
   *   skillSet: [5,3,2,1,4],
   *   skillDelay: 50,
   * \});
   */
  public async kill(
    monsterResolvable: string,
    options: Partial<KillOptions> = {},
  ): Promise<void> {
    if (!this.bot.player.isReady()) return;

    await this.bot.waitUntil(
      () => this.bot.world.isMonsterAvailable(monsterResolvable),
      null,
      3,
    );

    const opts = merge({}, DEFAULT_KILL_OPTIONS, options);
    const { killPriority, skillSet, skillDelay, skillWait, skillAction } = opts;
    let skillIndex = 0;

    return new Promise<void>((resolve) => {
      let stopCombatInterval: (() => void) | null = null;
      let stopCheckInterval: (() => void) | null = null;
      let isResolved = false;

      const _boundedSkillAction =
        typeof skillAction === "function"
          ? skillAction.bind({
              bot: this.bot,
              isRunning: () => !isResolved,
            })()
          : null;

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
        stopCombatInterval = stop;

        if (isResolved) {
          stop();
          return;
        }

        if (this.pauseAttack) {
          this.cancelAutoAttack();
          this.cancelTarget();
          await this.bot.waitUntil(() => !this.pauseAttack, null, -1);
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
            console.log("tick");
            await _boundedSkillAction().catch(() => {});
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
        stopCheckInterval = stop;

        if (isResolved) {
          stop();
          return;
        }

        const isIdle =
          this.bot.player.state === PlayerState.Idle &&
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
    const opts = merge({}, DEFAULT_KILL_OPTIONS, options);
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
      () => this.bot.world.isActionAvailable(GameAction.Rest),
      () => this.bot.auth.isLoggedIn(),
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
  public async exit(): Promise<void> {
    if (this.bot.player.isInCombat()) {
      await exitFromCombat();
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
   * Custom skill action function. If provided, the skillSet and skillDelay will be ignored.
   * Recommended to be a closure function.
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
