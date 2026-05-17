import { parseMonsterMapIdToken } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";

// Army player number or player name.
export type ArmyLoopTauntPlayer = number | string;

interface ArmyLoopTauntBaseOptions {
  readonly id?: string;
  readonly players?: readonly ArmyLoopTauntPlayer[];
  readonly skill: Skill;
  readonly target: MonsterIdentifierToken;
}

export type ArmyLoopTauntOptions =
  | (ArmyLoopTauntBaseOptions & {
      readonly aura: string;
      readonly message?: never;
    })
  | (ArmyLoopTauntBaseOptions & {
      readonly aura?: never;
      readonly message: string;
    });

export interface ArmyLoopTauntHandle {
  readonly id: string;
  stop(): import("./Services/Army").ArmyEffect<boolean>;
}

export interface ResolvedArmyPlayer {
  readonly name: string;
  readonly number: number;
}

export type NormalizedLoopTauntOptions = {
  readonly id: string;
  readonly participants: readonly ResolvedArmyPlayer[];
  readonly skill: Skill;
  readonly target: MonsterIdentifierToken;
  readonly trigger:
    | {
        readonly aura: string;
        readonly type: "aura";
      }
    | {
        readonly message: string;
        readonly type: "message";
      };
};

export interface LoopTauntTurnState {
  readonly nextIndex: number;
}

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
      ? `message:${options.message}`
      : `aura:${options.aura}`;
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

  return {
    id: createLoopTauntId(options),
    participants,
    skill,
    target,
    trigger: hasAura
      ? {
          aura: assertNonEmptyString("aura", options.aura),
          type: "aura",
        }
      : {
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
});
