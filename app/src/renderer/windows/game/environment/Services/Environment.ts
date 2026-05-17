import type {
  EnvironmentDropPolicy,
  EnvironmentItemRules,
  EnvironmentQuestAutoRegisterOptions,
  EnvironmentState,
} from "../../../../../shared/environment";
import { ServiceMap } from "effect";
import type { Effect } from "effect";

export interface EnvironmentShape {
  getState(): Effect.Effect<EnvironmentState, unknown>;
  clear(): Effect.Effect<EnvironmentState, unknown>;
  addQuest(
    questId: number | string,
    rewardItemId?: number | string,
  ): Effect.Effect<EnvironmentState, unknown>;
  removeQuest(
    questId: number | string,
  ): Effect.Effect<EnvironmentState, unknown>;
  setQuestReward(
    questId: number | string,
    rewardItemId: number | string,
  ): Effect.Effect<EnvironmentState, unknown>;
  clearQuestReward(
    questId: number | string,
  ): Effect.Effect<EnvironmentState, unknown>;
  clearQuests(): Effect.Effect<EnvironmentState, unknown>;
  /** Update both quest auto registration options at once. */
  setQuestAutoRegister(
    options: EnvironmentQuestAutoRegisterOptions,
  ): Effect.Effect<EnvironmentState, unknown>;
  /** Enable or disable auto registration of quest requirements in the drop list. */
  setAutoRegisterRequirements(
    enabled: boolean,
  ): Effect.Effect<EnvironmentState, unknown>;
  /** Enable or disable auto registration of quest rewards in the drop list. */
  setAutoRegisterRewards(
    enabled: boolean,
  ): Effect.Effect<EnvironmentState, unknown>;
  addItem(name: string): Effect.Effect<EnvironmentState, unknown>;
  removeItem(name: string): Effect.Effect<EnvironmentState, unknown>;
  /** Accept or ignore member-only AC-tagged items. */
  setAcceptAcMemberOnlyDrops(
    enabled: boolean,
  ): Effect.Effect<EnvironmentState, unknown>;
  /** Accept or ignore non-member AC-tagged items. */
  setAcceptAcNonMemberDrops(
    enabled: boolean,
  ): Effect.Effect<EnvironmentState, unknown>;
  /** Accept or ignore member-only non-AC items. */
  setAcceptNonAcMemberOnlyDrops(
    enabled: boolean,
  ): Effect.Effect<EnvironmentState, unknown>;
  /** Accept or ignore non-member non-AC items. */
  setAcceptNonAcNonMemberDrops(
    enabled: boolean,
  ): Effect.Effect<EnvironmentState, unknown>;
  /** Reject or ignore unregistered drops that are not accepted by policy. */
  setRejectUnregisteredDrops(
    enabled: boolean,
  ): Effect.Effect<EnvironmentState, unknown>;
  /** Update one or more drop handling options. */
  setDropPolicy(
    policy: Partial<EnvironmentDropPolicy>,
  ): Effect.Effect<EnvironmentState, unknown>;
  /**
   * Low-level bucket API kept for compatibility. Prefer setDropPolicy or the
   * explicit drop policy helpers.
   *
   * @deprecated Use setDropPolicy and the explicit drop policy helpers.
   */
  setItemRules(
    rules: EnvironmentItemRules,
  ): Effect.Effect<EnvironmentState, unknown>;
  clearItems(): Effect.Effect<EnvironmentState, unknown>;
  addBoost(name: string): Effect.Effect<EnvironmentState, unknown>;
  removeBoost(name: string): Effect.Effect<EnvironmentState, unknown>;
  clearBoosts(): Effect.Effect<EnvironmentState, unknown>;
  fetchBoosts(): Effect.Effect<readonly string[], unknown>;
  syncToAll(): Effect.Effect<EnvironmentState, unknown>;
}

export class Environment extends ServiceMap.Service<
  Environment,
  EnvironmentShape
>()("environment/Services/Environment") {}
