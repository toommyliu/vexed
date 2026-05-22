import { DEFAULT_COMBAT_PROFILE_ID } from "./combat-profiles";

export const DEFAULT_FOLLOWER_ATTEMPTS = 3;
export const DEFAULT_FOLLOWER_COMBAT_ENABLED = true;
export const DEFAULT_FOLLOWER_COPY_WALK = false;
export const DEFAULT_FOLLOWER_RETRY_ENABLED = true;

export type FollowerPhase =
  | "idle"
  | "starting"
  | "following"
  | "walking"
  | "combat"
  | "stopped";

export interface FollowerStartPayload {
  readonly targetName: string;
  readonly combatEnabled?: boolean;
  readonly copyWalk?: boolean;
  readonly retryEnabled?: boolean;
  readonly maxAttempts?: number;
  readonly selectedProfileId?: string;
  readonly attackPriority?: string | readonly (number | string)[];
  readonly lockedZoneFallbacks?: string | readonly FollowerLocationFallback[];
  readonly lockedZoneRoomOverride?: string;
}

export interface FollowerLocationFallback {
  readonly map: string;
  readonly cell?: string;
  readonly pad?: string;
}

export interface FollowerConfig {
  readonly targetName: string;
  readonly combatEnabled: boolean;
  readonly copyWalk: boolean;
  readonly retryEnabled: boolean;
  readonly maxAttempts: number;
  readonly selectedProfileId: string;
  readonly attackPriority: readonly (number | string)[];
  readonly lockedZoneFallbacks: readonly FollowerLocationFallback[];
  readonly lockedZoneRoomOverride: string;
}

export interface FollowerState {
  readonly enabled: boolean;
  readonly running: boolean;
  readonly targetName: string;
  readonly profileId?: string;
  readonly profileLabel?: string;
  readonly phase: FollowerPhase;
  readonly attemptsRemaining: number;
  readonly lastError?: string;
  readonly stoppedReason?: string;
}

const integerTokenPattern = /^\d+$/u;

const trimString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const parseAttackPriorityToken = (
  token: number | string,
): number | string | undefined => {
  if (typeof token === "number") {
    return Number.isFinite(token) && token > 0 ? Math.trunc(token) : undefined;
  }

  const trimmed = token.trim();
  if (trimmed === "") {
    return undefined;
  }

  if (integerTokenPattern.test(trimmed)) {
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  return trimmed;
};

export const splitFollowerAttackPriority = (
  value: FollowerStartPayload["attackPriority"],
): readonly (number | string)[] => {
  const rawTokens =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value
        : [];
  const parsed: (number | string)[] = [];
  const seen = new Set<string>();

  for (const rawToken of rawTokens) {
    const token = parseAttackPriorityToken(rawToken);
    if (token === undefined) {
      continue;
    }

    const key = `${typeof token}:${String(token).toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    parsed.push(token);
  }

  return parsed;
};

const normalizeLocationFallback = (
  fallback: unknown,
): FollowerLocationFallback | undefined => {
  if (
    typeof fallback !== "object" ||
    fallback === null ||
    Array.isArray(fallback)
  ) {
    return undefined;
  }

  const record = fallback as Record<string, unknown>;
  const map = typeof record["map"] === "string" ? record["map"].trim() : "";
  const cell =
    typeof record["cell"] === "string" ? record["cell"].trim() : undefined;
  const pad =
    typeof record["pad"] === "string" ? record["pad"].trim() : undefined;
  if (map === "") {
    return undefined;
  }

  return {
    map,
    ...(cell === undefined || cell === "" ? {} : { cell }),
    ...(pad === undefined || pad === "" ? {} : { pad }),
  };
};

const parseLocationFallbackLine = (
  line: string,
): FollowerLocationFallback | undefined => {
  const [map, cell, pad] = line.split(",").map((part) => part.trim());
  return normalizeLocationFallback({
    map: map ?? "",
    ...(cell === undefined ? {} : { cell }),
    ...(pad === undefined ? {} : { pad }),
  });
};

export const splitFollowerLocationFallbacks = (
  value: FollowerStartPayload["lockedZoneFallbacks"],
): readonly FollowerLocationFallback[] => {
  const rawFallbacks =
    typeof value === "string"
      ? value.split(/\r?\n/u).map(parseLocationFallbackLine)
      : Array.isArray(value)
        ? value.map(normalizeLocationFallback)
        : [];
  const fallbacks: FollowerLocationFallback[] = [];
  const seen = new Set<string>();

  for (const fallback of rawFallbacks) {
    if (fallback === undefined) {
      continue;
    }

    const key = [
      fallback.map.toLowerCase(),
      fallback.cell?.toLowerCase() ?? "",
      fallback.pad?.toLowerCase() ?? "",
    ].join("\0");
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    fallbacks.push(fallback);
  }

  return fallbacks;
};

export const normalizeFollowerTargetName = (value: unknown): string =>
  trimString(value).toLowerCase();

const normalizeFollowerMaxAttempts = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.trunc(value))
    : DEFAULT_FOLLOWER_ATTEMPTS;

export const normalizeFollowerConfig = (
  payload: FollowerStartPayload,
): FollowerConfig => ({
  targetName: normalizeFollowerTargetName(payload.targetName),
  combatEnabled: payload.combatEnabled ?? DEFAULT_FOLLOWER_COMBAT_ENABLED,
  copyWalk: payload.copyWalk ?? DEFAULT_FOLLOWER_COPY_WALK,
  retryEnabled: payload.retryEnabled ?? DEFAULT_FOLLOWER_RETRY_ENABLED,
  maxAttempts: normalizeFollowerMaxAttempts(payload.maxAttempts),
  selectedProfileId:
    trimString(payload.selectedProfileId) || DEFAULT_COMBAT_PROFILE_ID,
  attackPriority: splitFollowerAttackPriority(payload.attackPriority),
  lockedZoneFallbacks: splitFollowerLocationFallbacks(
    payload.lockedZoneFallbacks,
  ),
  lockedZoneRoomOverride: trimString(payload.lockedZoneRoomOverride),
});

export const createIdleFollowerState = (): FollowerState => ({
  enabled: false,
  running: false,
  targetName: "",
  phase: "idle",
  attemptsRemaining: DEFAULT_FOLLOWER_ATTEMPTS,
});

export const normalizeFollowerState = (value: unknown): FollowerState => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return createIdleFollowerState();
  }

  const record = value as Record<string, unknown>;
  const phase = record["phase"];
  const attemptsRemaining = record["attemptsRemaining"];
  const profileId = trimString(record["profileId"]);
  const profileLabel = trimString(record["profileLabel"]);
  const lastError = trimString(record["lastError"]);
  const stoppedReason = trimString(record["stoppedReason"]);

  return {
    enabled: record["enabled"] === true,
    running: record["running"] === true,
    targetName: normalizeFollowerTargetName(record["targetName"]),
    ...(profileId === "" ? {} : { profileId }),
    ...(profileLabel === "" ? {} : { profileLabel }),
    phase:
      phase === "starting" ||
      phase === "following" ||
      phase === "walking" ||
      phase === "combat" ||
      phase === "stopped"
        ? phase
        : "idle",
    attemptsRemaining:
      typeof attemptsRemaining === "number" &&
      Number.isFinite(attemptsRemaining)
        ? Math.max(0, Math.trunc(attemptsRemaining))
        : DEFAULT_FOLLOWER_ATTEMPTS,
    ...(lastError === "" ? {} : { lastError }),
    ...(stoppedReason === "" ? {} : { stoppedReason }),
  };
};
