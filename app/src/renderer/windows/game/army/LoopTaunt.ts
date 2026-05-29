import { parseMonsterMapIdToken } from "@vexed/game";
import type { Aura } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import type { Effect } from "effect";
import type {
  WorldMonstersShape,
  WorldPlayersShape,
} from "../flash/Services/World";
import type { ArmyEffect } from "./Services/Army";
export {
  DEFAULT_LOOP_TAUNT_CAST_SETTLE_MS,
  DEFAULT_LOOP_TAUNT_DELAY_MS,
  DEFAULT_LOOP_TAUNT_MESSAGE_DEBOUNCE_MS,
  DEFAULT_LOOP_TAUNT_RESPAWN_RECOVERY_MS,
  LOOP_TAUNT_ACTION_LOCK_AURA_CATEGORIES,
  LOOP_TAUNT_FOCUS_AURA_ICON,
  LOOP_TAUNT_RETRY_SETTLE_MS,
  LOOP_TAUNT_SHORT_RETRY_MS,
} from "../../../../shared/loop-taunt";
import {
  DEFAULT_LOOP_TAUNT_DELAY_MS,
  DEFAULT_LOOP_TAUNT_MESSAGE_DEBOUNCE_MS,
  LOOP_TAUNT_FOCUS_AURA_ICON,
} from "../../../../shared/loop-taunt";

// Army player number or player name.
export type ArmyLoopTauntPlayer = number | string;

export type ArmyLoopTauntNoEligiblePolicy = "throw" | "cast-scheduled";

export type NormalizedLoopTauntTrigger =
  | {
      readonly aura: string;
      readonly delayMs: number;
      readonly type: "aura";
    }
  | {
      readonly debounceMs: number;
      readonly message: string;
      readonly type: "message";
    };

export interface ArmyLoopTauntTurnContext {
  readonly id: string;
  readonly target: {
    readonly token: MonsterIdentifierToken;
    readonly monMapId: number;
  };
  readonly localPlayer: ResolvedArmyPlayer;
  readonly scheduled: ResolvedArmyPlayer;
  readonly candidate: ResolvedArmyPlayer;
  readonly participants: readonly ResolvedArmyPlayer[];
  readonly turn: {
    readonly index: number;
    readonly triggerCount: number;
  };
  readonly trigger: NormalizedLoopTauntTrigger;
  readonly world: {
    readonly players: Pick<
      WorldPlayersShape,
      "getAll" | "getByName" | "getAuras" | "getAura"
    >;
    readonly monsters: Pick<WorldMonstersShape, "get" | "getAura">;
  };
}

export type ArmyLoopTauntShouldTaunt = (
  context: ArmyLoopTauntTurnContext,
) => boolean | Effect.Effect<boolean, unknown>;

interface ArmyLoopTauntBaseOptions {
  readonly id?: string;
  readonly noEligiblePolicy?: ArmyLoopTauntNoEligiblePolicy;
  readonly players?: readonly ArmyLoopTauntPlayer[];
  readonly shouldTaunt?: ArmyLoopTauntShouldTaunt;
  readonly skill: Skill;
  readonly target: MonsterIdentifierToken;
}

export type ArmyLoopTauntOptions =
  | (ArmyLoopTauntBaseOptions & {
      readonly aura: string;
      readonly delayMs?: number;
      readonly debounceMs?: never;
      readonly message?: never;
    })
  | (ArmyLoopTauntBaseOptions & {
      readonly aura?: never;
      readonly debounceMs?: number;
      readonly delayMs?: never;
      readonly message: string;
    });

export interface ArmyLoopTauntHandle {
  readonly id: string;
  stop(): ArmyEffect<boolean>;
}

export interface ResolvedArmyPlayer {
  readonly name: string;
  readonly number: number;
}

export type NormalizedLoopTauntOptions = {
  readonly id: string;
  readonly noEligiblePolicy: ArmyLoopTauntNoEligiblePolicy;
  readonly participants: readonly ResolvedArmyPlayer[];
  readonly shouldTaunt?: ArmyLoopTauntShouldTaunt;
  readonly skill: Skill;
  readonly target: MonsterIdentifierToken;
  readonly trigger: NormalizedLoopTauntTrigger;
};

export interface LoopTauntTurnState {
  readonly nextIndex: number;
  readonly triggerCount: number;
}

export interface LoopTauntTurnResolution {
  readonly nextState: LoopTauntTurnState;
  readonly scheduled: ResolvedArmyPlayer;
  readonly selected: ResolvedArmyPlayer;
  readonly selectedIndex: number;
  readonly skipped: readonly ResolvedArmyPlayer[];
}

export type LoopTauntCastOutcome =
  | {
      readonly type: "cast";
    }
  | {
      readonly reason:
        | "failed"
        | "in-flight"
        | "not-alive"
        | "not-ready"
        | "not-usable";
      readonly type: "skipped";
    };

const normalizeText = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const targetLabel = (target: MonsterIdentifierToken): string =>
  typeof target === "number" ? String(target) : target.trim();

export const resolveTargetMonMapIdToken = (
  target: MonsterIdentifierToken,
): number | undefined => parseMonsterMapIdToken(target);

export const isTargetNameToken = (target: MonsterIdentifierToken): boolean =>
  typeof target === "string" &&
  resolveTargetMonMapIdToken(target) === undefined;

export const matchesLoopTauntAura = (
  configuredAura: string,
  auraName: string,
): boolean => equalsIgnoreCase(configuredAura, auraName);

export const matchesLoopTauntAuraAdd = (
  configuredAura: string,
  auraName: string,
  aura?: Pick<Aura, "icon">,
): boolean => {
  if (!matchesLoopTauntAura(configuredAura, auraName)) {
    return false;
  }

  if (!equalsIgnoreCase(configuredAura, "Focus")) {
    return true;
  }

  return aura?.icon === LOOP_TAUNT_FOCUS_AURA_ICON;
};

export const matchesLoopTauntMessage = (
  configuredMessage: string,
  message: string,
): boolean => normalizeText(message).includes(normalizeText(configuredMessage));

export const createLoopTauntId = (
  options: Pick<ArmyLoopTauntOptions, "aura" | "id" | "message" | "target">,
): string => {
  if (options.id?.trim()) {
    return options.id.trim();
  }

  const trigger =
    typeof options.message === "string"
      ? `message:${options.message.trim()}`
      : `aura:${options.aura?.trim() ?? ""}`;
  return `loop-taunt:${targetLabel(options.target)}:${trigger}`;
};

const assertNonEmptyString = (label: string, value: unknown): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
};

const assertValidSkill = (skill: unknown): Skill => {
  if (typeof skill === "number") {
    if (!Number.isFinite(skill)) {
      throw new Error("skill must be a finite number or non-empty string");
    }

    return Math.trunc(skill);
  }

  if (typeof skill !== "string" || skill.trim() === "") {
    throw new Error("skill must be a finite number or non-empty string");
  }

  return skill.trim();
};

const assertValidTarget = (
  target: MonsterIdentifierToken,
): MonsterIdentifierToken => {
  if (typeof target === "number") {
    if (!Number.isFinite(target) || target <= 0) {
      throw new Error("target must be a positive monster id or non-empty name");
    }

    return Math.trunc(target);
  }

  if (typeof target !== "string" || target.trim() === "") {
    throw new Error("target must be a positive monster id or non-empty name");
  }

  return target.trim();
};

const assertValidDelayMs = (delayMs: unknown): number => {
  if (delayMs === undefined) {
    return DEFAULT_LOOP_TAUNT_DELAY_MS;
  }

  if (typeof delayMs !== "number" || !Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error("delayMs must be a finite non-negative number");
  }

  return Math.trunc(delayMs);
};

const assertValidMessageDebounceMs = (debounceMs: unknown): number => {
  if (debounceMs === undefined) {
    return DEFAULT_LOOP_TAUNT_MESSAGE_DEBOUNCE_MS;
  }

  if (
    typeof debounceMs !== "number" ||
    !Number.isFinite(debounceMs) ||
    debounceMs < 0
  ) {
    throw new Error("debounceMs must be a finite non-negative number");
  }

  return Math.trunc(debounceMs);
};

const assertValidNoEligiblePolicy = (
  policy: unknown,
): ArmyLoopTauntNoEligiblePolicy => {
  if (policy === undefined) {
    return "throw";
  }

  if (policy !== "throw" && policy !== "cast-scheduled") {
    throw new Error('noEligiblePolicy must be "throw" or "cast-scheduled"');
  }

  return policy;
};

const assertValidShouldTaunt = (
  shouldTaunt: unknown,
): ArmyLoopTauntShouldTaunt | undefined => {
  if (shouldTaunt === undefined) {
    return undefined;
  }

  if (typeof shouldTaunt !== "function") {
    throw new Error("shouldTaunt must be a function");
  }

  return shouldTaunt as ArmyLoopTauntShouldTaunt;
};

export const resolveLoopTauntParticipants = (
  sessionPlayers: readonly string[],
  players: readonly ArmyLoopTauntPlayer[] | undefined,
): readonly ResolvedArmyPlayer[] => {
  if (sessionPlayers.length === 0) {
    throw new Error("army session has no players");
  }

  const refs = players ?? sessionPlayers.map((_, index) => index + 1);
  if (refs.length === 0) {
    throw new Error("players must contain at least one army player");
  }

  const resolved: ResolvedArmyPlayer[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    let player: ResolvedArmyPlayer | undefined;
    if (typeof ref === "number") {
      if (!Number.isInteger(ref) || ref < 1 || ref > sessionPlayers.length) {
        throw new Error(`Unknown army player number: ${String(ref)}`);
      }

      player = {
        name: sessionPlayers[ref - 1]!,
        number: ref,
      };
    } else if (typeof ref === "string" && ref.trim() !== "") {
      const name = ref.trim();
      const index = sessionPlayers.findIndex((sessionPlayer) =>
        equalsIgnoreCase(sessionPlayer, name),
      );
      if (index === -1) {
        throw new Error(`Unknown army player name: ${name}`);
      }

      player = {
        name: sessionPlayers[index]!,
        number: index + 1,
      };
    } else {
      throw new Error("players must contain army player numbers or names");
    }

    const key = player.name.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate loop taunt player: ${player.name}`);
    }

    seen.add(key);
    resolved.push(player);
  }

  return resolved;
};

export const normalizeLoopTauntOptions = (
  options: ArmyLoopTauntOptions,
  sessionPlayers: readonly string[],
): NormalizedLoopTauntOptions => {
  const target = assertValidTarget(options.target);
  const skill = assertValidSkill(options.skill);
  const hasAura = typeof options.aura === "string";
  const hasMessage = typeof options.message === "string";

  if (hasAura === hasMessage) {
    throw new Error("Loop Taunt requires exactly one of aura or message");
  }

  const participants = resolveLoopTauntParticipants(
    sessionPlayers,
    options.players,
  );
  const shouldTaunt = assertValidShouldTaunt(options.shouldTaunt);

  return {
    id: createLoopTauntId(options),
    noEligiblePolicy: assertValidNoEligiblePolicy(options.noEligiblePolicy),
    participants,
    ...(shouldTaunt === undefined ? {} : { shouldTaunt }),
    skill,
    target,
    trigger: hasAura
      ? {
          aura: assertNonEmptyString("aura", options.aura),
          delayMs: assertValidDelayMs(options.delayMs),
          type: "aura",
        }
      : {
          debounceMs: assertValidMessageDebounceMs(options.debounceMs),
          message: assertNonEmptyString("message", options.message),
          type: "message",
        },
  };
};

export const ownsLoopTauntTurn = (
  participants: readonly ResolvedArmyPlayer[],
  localPlayerNumber: number,
  state: LoopTauntTurnState,
): boolean => participants[state.nextIndex]?.number === localPlayerNumber;

export const advanceLoopTauntTurn = (
  participants: readonly ResolvedArmyPlayer[],
  state: LoopTauntTurnState,
): LoopTauntTurnState => ({
  nextIndex:
    participants.length === 0 ? 0 : (state.nextIndex + 1) % participants.length,
  triggerCount: state.triggerCount,
});

export const resolveLoopTauntTurn = (
  participants: readonly ResolvedArmyPlayer[],
  state: LoopTauntTurnState,
  shouldSelect: (
    candidate: ResolvedArmyPlayer,
    index: number,
  ) => boolean = () => true,
  noEligiblePolicy: ArmyLoopTauntNoEligiblePolicy = "throw",
): LoopTauntTurnResolution => {
  if (participants.length === 0) {
    throw new Error("Loop Taunt requires at least one participant");
  }

  const startIndex = state.nextIndex % participants.length;
  const scheduled = participants[startIndex]!;
  const skipped: ResolvedArmyPlayer[] = [];

  for (let offset = 0; offset < participants.length; offset += 1) {
    const candidateIndex = (startIndex + offset) % participants.length;
    const candidate = participants[candidateIndex]!;
    if (shouldSelect(candidate, candidateIndex)) {
      return {
        nextState: {
          nextIndex: (candidateIndex + 1) % participants.length,
          triggerCount: state.triggerCount + 1,
        },
        scheduled,
        selected: candidate,
        selectedIndex: candidateIndex,
        skipped,
      };
    }

    skipped.push(candidate);
  }

  if (noEligiblePolicy === "cast-scheduled") {
    return {
      nextState: {
        nextIndex: (startIndex + 1) % participants.length,
        triggerCount: state.triggerCount + 1,
      },
      scheduled,
      selected: scheduled,
      selectedIndex: startIndex,
      skipped,
    };
  }

  throw new Error("Loop Taunt found no eligible participant");
};
