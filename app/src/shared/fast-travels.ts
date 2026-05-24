export interface FastTravel {
  readonly name: string;
  readonly map: string;
  readonly cell?: string;
  readonly pad?: string;
}

export interface FastTravelDraft {
  readonly name: string;
  readonly map: string;
  readonly cell?: string;
  readonly pad?: string;
}

export interface FastTravelWarpPayload {
  readonly location: FastTravel;
  readonly roomNumber?: number;
}

export const MIN_FAST_TRAVEL_ROOM_NUMBER = 1;
export const MAX_FAST_TRAVEL_ROOM_NUMBER = 100_000;

export const DEFAULT_FAST_TRAVELS: readonly FastTravel[] = [
  { name: "Oblivion", map: "tercessuinotlim", cell: "Enter", pad: "Spawn" },
  {
    name: "Twins",
    map: "tercessuinotlim",
    cell: "Twins",
    pad: "Left",
  },
  {
    name: "VHL/Taro/Zee",
    map: "tercessuinotlim",
    cell: "Taro",
    pad: "Left",
  },
  {
    name: "Swindle",
    map: "tercessuinotlim",
    cell: "Swindle",
    pad: "Left",
  },
  {
    name: "Nulgath/Skew",
    map: "tercessuinotlim",
    cell: "Boss2",
    pad: "Right",
  },
  {
    name: "Polish",
    map: "tercessuinotlim",
    cell: "m12",
    pad: "Top",
  },
  {
    name: "Carnage/Ninja",
    map: "tercessuinotlim",
    cell: "m4",
    pad: "Top",
  },
  {
    name: "Binky",
    map: "doomvault",
    cell: "r5",
    pad: "Left",
  },
  {
    name: "Dage",
    map: "underworld",
    cell: "s1",
    pad: "Left",
  },
  {
    name: "Escherion",
    map: "escherion",
    cell: "Boss",
    pad: "Left",
  },
];

export class FastTravelValidationError extends Error {
  constructor(
    message: string,
    readonly field: "name" | "map",
  ) {
    super(message);
    this.name = "FastTravelValidationError";
  }
}

export class FastTravelDuplicateNameError extends Error {
  constructor(readonly locationName: string) {
    super(`Fast travel location already exists: ${locationName}`);
    this.name = "FastTravelDuplicateNameError";
  }
}

export class FastTravelNotFoundError extends Error {
  constructor(readonly locationName: string) {
    super(`Fast travel location not found: ${locationName}`);
    this.name = "FastTravelNotFoundError";
  }
}

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const optionalTrimmed = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

export const sameFastTravelName = (left: string, right: string): boolean =>
  normalizeKey(left) === normalizeKey(right);

export const cloneDefaultFastTravels = (): FastTravel[] =>
  DEFAULT_FAST_TRAVELS.map((location) => ({ ...location }));

export const normalizeFastTravelDraft = (draft: unknown): FastTravel => {
  const record =
    typeof draft === "object" && draft !== null
      ? (draft as Partial<FastTravelDraft>)
      : {};
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (name === "") {
    throw new FastTravelValidationError("Location name is required", "name");
  }

  const map =
    typeof record.map === "string" ? record.map.trim().toLowerCase() : "";
  if (map === "") {
    throw new FastTravelValidationError("Map is required", "map");
  }

  const cell = optionalTrimmed(record.cell);
  const pad = optionalTrimmed(record.pad);

  return {
    name,
    map,
    ...(cell === undefined ? {} : { cell }),
    ...(pad === undefined ? {} : { pad }),
  };
};

export const normalizeFastTravels = (value: unknown): FastTravel[] => {
  if (!Array.isArray(value)) {
    return cloneDefaultFastTravels();
  }

  const locations: FastTravel[] = [];
  const names = new Set<string>();

  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const record = item as Partial<FastTravel>;
    if (typeof record.name !== "string" || typeof record.map !== "string") {
      continue;
    }

    let location: FastTravel;
    try {
      location = normalizeFastTravelDraft({
        name: record.name,
        map: record.map,
        ...(typeof record.cell === "string" ? { cell: record.cell } : {}),
        ...(typeof record.pad === "string" ? { pad: record.pad } : {}),
      });
    } catch {
      continue;
    }

    const key = normalizeKey(location.name);
    if (names.has(key)) {
      continue;
    }

    names.add(key);
    locations.push(location);
  }

  return locations;
};

export const addFastTravel = (
  locations: readonly FastTravel[],
  draft: FastTravelDraft,
): FastTravel[] => {
  const location = normalizeFastTravelDraft(draft);
  if (
    locations.some((candidate) =>
      sameFastTravelName(candidate.name, location.name),
    )
  ) {
    throw new FastTravelDuplicateNameError(location.name);
  }

  return [...locations, location];
};

export const updateFastTravel = (
  locations: readonly FastTravel[],
  originalName: string,
  draft: FastTravelDraft,
): FastTravel[] => {
  const index = locations.findIndex((location) =>
    sameFastTravelName(location.name, originalName),
  );
  if (index === -1) {
    throw new FastTravelNotFoundError(originalName);
  }

  const location = normalizeFastTravelDraft(draft);
  const duplicate = locations.some(
    (candidate, candidateIndex) =>
      candidateIndex !== index &&
      sameFastTravelName(candidate.name, location.name),
  );
  if (duplicate) {
    throw new FastTravelDuplicateNameError(location.name);
  }

  return locations.map((candidate, candidateIndex) =>
    candidateIndex === index ? location : candidate,
  );
};

export const deleteFastTravel = (
  locations: readonly FastTravel[],
  name: string,
): FastTravel[] => {
  const next = locations.filter(
    (location) => !sameFastTravelName(location.name, name),
  );
  if (next.length === locations.length) {
    throw new FastTravelNotFoundError(name);
  }

  return next;
};

export const normalizeFastTravelRoomNumber = (
  value: unknown,
): number | undefined => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const room = Math.trunc(parsed);
  return Math.min(
    MAX_FAST_TRAVEL_ROOM_NUMBER,
    Math.max(MIN_FAST_TRAVEL_ROOM_NUMBER, room),
  );
};

export const normalizeFastTravelWarpPayload = (
  payload: unknown,
): FastTravelWarpPayload => {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Fast travel payload is required");
  }

  const record = payload as {
    readonly location?: FastTravelDraft;
    readonly roomNumber?: unknown;
  };

  const roomNumber = normalizeFastTravelRoomNumber(record.roomNumber);

  return {
    location: normalizeFastTravelDraft(
      record.location ?? {
        name: "",
        map: "",
      },
    ),
    ...(roomNumber === undefined ? {} : { roomNumber }),
  };
};

export const fastTravelMapTarget = (payload: FastTravelWarpPayload): string => {
  const roomNumber = normalizeFastTravelRoomNumber(payload.roomNumber);
  return roomNumber === undefined
    ? payload.location.map
    : `${payload.location.map}-${roomNumber}`;
};
