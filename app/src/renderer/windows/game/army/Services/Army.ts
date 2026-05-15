import { Effect, ServiceMap } from "effect";
import type {
  ArmyConfigRaw,
  ArmySessionPayload,
} from "../../../../../shared/army";
import type { BridgeError } from "../../flash/Services/Bridge";
import type { CombatKillOptions } from "../../flash/Services/Combat";

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
  getConfigValue(key: string, defaultValue?: unknown): ArmyEffect<unknown>;
  getConfigString(key: string, defaultValue?: string): ArmyEffect<string>;
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
    quantity: number,
    isTemp: boolean,
    options?: CombatKillOptions,
  ): ArmyEffect<void>;
  equipSet(setName: string, options?: ArmyEquipSetOptions): ArmyEffect<void>;
}

export class Army extends ServiceMap.Service<Army, ArmyShape>()(
  "army/Services/Army",
) {}

export type { ArmyConfigRaw };
