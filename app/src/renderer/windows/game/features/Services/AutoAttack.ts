import { Effect, ServiceMap } from "effect";
import type {
  CombatProfileLibrary,
  CombatProfileRef,
} from "../../../../../shared/combat-profiles";

export interface AutoAttackStartOptions {
  readonly library: CombatProfileLibrary;
  readonly profileRef: CombatProfileRef;
}

export interface AutoAttackState {
  readonly enabled: boolean;
  readonly running: boolean;
  readonly profileId?: string;
  readonly profileLabel?: string;
  readonly lastError?: string;
}

export type AutoAttackStateDisposer = () => void;

export type AutoAttackStateListener = (state: AutoAttackState) => void;

export interface AutoAttackStateSubscriptionOptions {
  readonly emitCurrent?: boolean;
}

export interface AutoAttackShape {
  readonly getState: () => Effect.Effect<AutoAttackState>;
  readonly onState: (
    listener: AutoAttackStateListener,
    options?: AutoAttackStateSubscriptionOptions,
  ) => Effect.Effect<AutoAttackStateDisposer>;
  readonly enable: (
    options: AutoAttackStartOptions,
  ) => Effect.Effect<AutoAttackState, unknown>;
  readonly disable: () => Effect.Effect<AutoAttackState>;
}

export class AutoAttack extends ServiceMap.Service<
  AutoAttack,
  AutoAttackShape
>()("features/Services/AutoAttack") {}
