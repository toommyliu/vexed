import { Effect, ServiceMap } from "effect";
import type {
  ArmyConfigRaw,
  ArmySessionPayload,
} from "../../../../../shared/army";
import type { BridgeError } from "../../flash/Services/Bridge";
import type { CombatKillOptions } from "../../flash/Services/Combat";
import type { ArmyLoopTauntHandle, ArmyLoopTauntOptions } from "../LoopTaunt";

export class ArmyError extends Error {
  readonly _tag = "ArmyError";

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ArmyError";
    if (cause !== undefined) {
      Object.defineProperty(this, "cause", {
        configurable: true,
        enumerable: false,
        value: cause,
        writable: true,
      });
    }
  }
}

export type ArmyEffect<A, E = never> = Effect.Effect<
  A,
  E | ArmyError | BridgeError
>;

export interface ArmyRunStepOptions {
  readonly timeoutMs?: number;
}

export interface ArmyEquipSetOptions {
  /**
   * When true, items will be resolved under the `items` key of the army config.
   */
  readonly resolveItems?: boolean;
}

export interface ArmyEquipSet {
  readonly Armor?: string;
  readonly Cape?: string;
  readonly Class?: string;
  readonly Helm?: string;
  readonly Pet?: string;
  readonly Pots?: readonly string[];
  readonly SafeClass?: string;
  readonly SafePot?: string;
  readonly Scroll?: string;
  readonly Weapon?: string;
}

export type ArmySession = ArmySessionPayload;

export interface ArmyShape {
  start(configName: string): ArmyEffect<ArmySession>;
  leave(): ArmyEffect<void>;
  isStarted(): ArmyEffect<boolean>;
  isLeader(): ArmyEffect<boolean>;
  isMember(): ArmyEffect<boolean>;
  getSession(): ArmyEffect<ArmySession | null>;
  /**
   * Reads a value from the active army config.
   *
   * Dot-separated keys read nested object values. An empty key returns the raw
   * config object. Returns `defaultValue` when the army is not started (a.k.a. no config loaded), the key
   * is missing, or a nested path cannot be resolved.
   */
  getConfigValue(key: string, defaultValue?: unknown): ArmyEffect<unknown>;
  /**
   * Reads a string value from the active army config.
   *
   * Uses the same key resolution rules as `getConfigValue`, but returns
   * `defaultValue` when the resolved value is missing or not a string.
   */
  getConfigString(key: string, defaultValue?: string): ArmyEffect<string>;
  /**
   * The player's number in the army, starting at 1 for the leader and incrementing
   * for each member.
   */
  getPlayerNumber(): ArmyEffect<number>;
  sync(label?: string, options?: ArmyRunStepOptions): ArmyEffect<void>;
  runStep<A, E>(
    label: string,
    action: Effect.Effect<A, E>,
    options?: ArmyRunStepOptions,
  ): ArmyEffect<A, E>;
  executeWithArmy<A, E>(action: Effect.Effect<A, E>): ArmyEffect<A, E>;
  waitForAllInMap(): ArmyEffect<void>;
  joinMap(map: string, cell?: string, pad?: string): ArmyEffect<void>;
  kill(
    target: MonsterIdentifierToken,
    options?: CombatKillOptions,
  ): ArmyEffect<void>;
  killForItem(
    target: MonsterIdentifierToken,
    item: ItemIdentifierToken,
    quantity?: number,
    options?: CombatKillOptions,
  ): ArmyEffect<void>;
  killForTempItem(
    target: MonsterIdentifierToken,
    item: ItemIdentifierToken,
    quantity?: number,
    options?: CombatKillOptions,
  ): ArmyEffect<void>;
  /**
   * @param setName Name of the army config set to equip.
   * @param options Set-equipping options.
   */
  equipSet(setName: string, options?: ArmyEquipSetOptions): ArmyEffect<void>;
  startLoopTaunt(
    options: ArmyLoopTauntOptions,
  ): ArmyEffect<ArmyLoopTauntHandle>;
  stopLoopTaunt(id: string): ArmyEffect<boolean>;
  stopAllLoopTaunts(): ArmyEffect<void>;
}

export class Army extends ServiceMap.Service<Army, ArmyShape>()(
  "army/Services/Army",
) {}

export type { ArmyConfigRaw };
export type {
  ArmyLoopTauntHandle,
  ArmyLoopTauntNoEligiblePolicy,
  ArmyLoopTauntOptions,
  ArmyLoopTauntPlayer,
  ArmyLoopTauntShouldTaunt,
  ArmyLoopTauntTurnContext,
} from "../LoopTaunt";
