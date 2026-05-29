export type ArmyConfigRaw = Record<string, unknown>;

export interface ArmyConfigCore {
  readonly leader: string;
  readonly players: readonly string[];
  readonly roomNumber: string;
}

export interface ArmyConfigPayload extends ArmyConfigCore {
  readonly configName: string;
  readonly raw: ArmyConfigRaw;
}

export interface ArmyStartPayload {
  readonly configName: string;
  readonly playerName: string;
}

export interface ArmySessionPayload extends ArmyConfigPayload {
  readonly sessionId: string;
  readonly playerName: string;
  readonly playerNumber: number;
  readonly role: "leader" | "member";
}

export interface ArmyLeavePayload {
  readonly sessionId: string;
  readonly playerName?: string;
}

export interface ArmyBarrierPayload {
  readonly sessionId: string;
  readonly playerName: string;
  readonly step: number;
  readonly label?: string;
  readonly players?: readonly string[];
  readonly timeoutMs?: number;
}

export interface ArmyStatusPayload {
  readonly sessionId: string;
}

export interface ArmyStatusResult {
  readonly active: boolean;
  readonly configName?: string;
  readonly players?: readonly string[];
  readonly joinedPlayers?: readonly string[];
  readonly waitingBarriers?: number;
}

export interface ArmyLoopTauntParticipantPayload {
  readonly name: string;
  readonly number: number;
}

export interface ArmyLoopTauntStartPayload {
  readonly sessionId: string;
  readonly playerName: string;
  readonly id: string;
  readonly aura: string;
  readonly delayMs: number;
  readonly skill: number | string;
  readonly targetMonMapId: number;
  readonly participants: readonly ArmyLoopTauntParticipantPayload[];
}

export interface ArmyLoopTauntStopPayload {
  readonly sessionId: string;
  readonly playerName: string;
  readonly id: string;
}

export type ArmyLoopTauntObservationType =
  | "aura-added"
  | "aura-missing"
  | "aura-removed"
  | "cast-outcome"
  | "client-cast-attempt"
  | "server-cast-confirmed";

export type ArmyLoopTauntCastOutcomeReason =
  | "failed"
  | "in-flight"
  | "not-alive"
  | "not-ready"
  | "not-usable";

export interface ArmyLoopTauntObservationPayload {
  readonly sessionId: string;
  readonly playerName: string;
  readonly id: string;
  readonly type: ArmyLoopTauntObservationType;
  readonly targetMonMapId: number;
  readonly auraName?: string;
  readonly auraIcon?: string;
  readonly epoch?: number;
  readonly attempt?: number;
  readonly outcome?: "cast" | "skipped";
  readonly reason?: ArmyLoopTauntCastOutcomeReason;
}

export interface ArmyLoopTauntCommandPayload {
  readonly sessionId: string;
  readonly id: string;
  readonly epoch: number;
  readonly attempt: number;
  readonly reason: string;
  readonly skill: number | string;
  readonly targetMonMapId: number;
  readonly selected: ArmyLoopTauntParticipantPayload;
}

export const normalizeArmyConfigName = (fileName: string): string => {
  let normalized = fileName.trim();
  for (const extension of [".yaml", ".yml", ".json"] as const) {
    if (normalized.toLowerCase().endsWith(extension)) {
      normalized = normalized.slice(0, -extension.length);
      break;
    }
  }

  return normalized.trim();
};

export const isValidArmyConfigName = (configName: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(configName);

export const assertValidArmyConfigName = (fileName: string): string => {
  const configName = normalizeArmyConfigName(fileName);
  if (configName === "") {
    throw new Error("Army config name is required");
  }

  if (!isValidArmyConfigName(configName)) {
    throw new Error(
      "Army config name may only contain letters, numbers, dots, dashes, and underscores",
    );
  }

  return configName;
};

const isRecord = (value: unknown): value is ArmyConfigRaw =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized === "" ? undefined : normalized;
};

const parsePlayersArray = (value: unknown): readonly string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const players = value.map(readString);
  if (players.some((player) => player === undefined)) {
    throw new Error("players must only contain non-empty strings");
  }

  return players as readonly string[];
};

const parseLegacyPlayers = (
  raw: ArmyConfigRaw,
): readonly string[] | undefined => {
  const playerCount = raw["PlayerCount"];
  if (playerCount === undefined) {
    return undefined;
  }

  if (
    typeof playerCount !== "number" ||
    !Number.isInteger(playerCount) ||
    playerCount < 1
  ) {
    throw new Error("PlayerCount must be a positive integer");
  }

  const players: string[] = [];
  for (let index = 1; index <= playerCount; index++) {
    const key = `Player${index}`;
    const player = readString(raw[key]);
    if (player === undefined) {
      throw new Error(`${key} must be a non-empty string`);
    }

    players.push(player);
  }

  return players;
};

const assertUniquePlayers = (players: readonly string[]): void => {
  const seen = new Set<string>();
  for (const player of players) {
    const key = player.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate army player: ${player}`);
    }

    seen.add(key);
  }
};

export const assertArmyConfigRaw = (value: unknown): ArmyConfigRaw => {
  if (!isRecord(value)) {
    throw new Error("Army config must be a YAML object");
  }

  return value;
};

export const parseArmyConfigCore = (value: unknown): ArmyConfigCore => {
  const raw = assertArmyConfigRaw(value);
  const players = parsePlayersArray(raw["players"]) ?? parseLegacyPlayers(raw);
  if (players === undefined || players.length === 0) {
    throw new Error("Army config must define at least one player");
  }

  assertUniquePlayers(players);

  const roomNumber =
    readString(raw["room"]) ??
    readString(raw["roomNumber"]) ??
    readString(raw["RoomNumber"]);
  if (roomNumber === undefined) {
    throw new Error("Army config must define room or RoomNumber");
  }

  const leader = readString(raw["leader"]) ?? players[0];
  if (leader === undefined) {
    throw new Error("Army config must define a leader");
  }

  const leaderKey = leader.toLowerCase();
  if (!players.some((player) => player.toLowerCase() === leaderKey)) {
    throw new Error("Army leader must be listed in players");
  }

  return {
    leader,
    players,
    roomNumber,
  };
};

export const normalizeArmyConfig = (
  configName: string,
  value: unknown,
): ArmyConfigPayload => {
  const raw = assertArmyConfigRaw(value);
  const core = parseArmyConfigCore(raw);
  return {
    configName: assertValidArmyConfigName(configName),
    raw,
    ...core,
  };
};
