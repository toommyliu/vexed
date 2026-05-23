export const COMBAT_PROFILE_LIBRARY_VERSION = 1 as const;

export const DEFAULT_COMBAT_PROFILE_ID = "generic-base";
export const DEFAULT_COMBAT_PROFILE_ROLE = "Base";
export const DEFAULT_COMBAT_PROFILE_DELAY_MS = 150;
export const DEFAULT_COMBAT_PROFILE_TIMEOUT_MS = 10_000;

export const CombatProfileCooldownModes = [
  "use-if-ready",
  "wait-for-cooldown",
] as const;

export type CombatProfileCooldownMode =
  (typeof CombatProfileCooldownModes)[number];

export const CombatProfileAutoAttackModes = [
  "generic",
  "equipped-class",
  "selected",
] as const;

export type CombatProfileAutoAttackMode =
  (typeof CombatProfileAutoAttackModes)[number];

export type CombatProfileThresholdUnit = "percent" | "value";
export type CombatProfileComparison = "<=" | ">=";

export type CombatProfileStatCondition = {
  readonly type: "self-hp" | "self-mp" | "ally-hp";
  readonly op: CombatProfileComparison;
  readonly value: number;
  readonly unit: CombatProfileThresholdUnit;
};

export type CombatProfileAuraCondition = {
  readonly type: "self-aura" | "target-aura";
  readonly auraName: string;
  readonly op: CombatProfileComparison;
  readonly value: number;
};

export type CombatProfileCondition =
  | CombatProfileStatCondition
  | CombatProfileAuraCondition;

export interface CombatProfileStep {
  readonly id: string;
  readonly skill: number;
  readonly conditions: readonly CombatProfileCondition[];
  readonly cooldownMode?: CombatProfileCooldownMode;
  readonly waitMs?: number;
}

export interface CombatProfileAnimationTrigger {
  readonly id: string;
  readonly messageIncludes: string;
  readonly skill: number;
  readonly cooldownMs?: number;
}

export interface CombatProfile {
  readonly id: string;
  readonly label: string;
  readonly className?: string;
  readonly role: string;
  readonly delayMs: number;
  readonly cooldownMode: CombatProfileCooldownMode;
  readonly timeoutMs: number;
  readonly steps: readonly CombatProfileStep[];
  readonly animationTriggers?: readonly CombatProfileAnimationTrigger[];
}

export interface CombatProfileRefSelected {
  readonly mode: "selected";
  readonly profileId: string;
}

export type CombatProfileRef =
  | "generic"
  | "equipped-class"
  | CombatProfileRefSelected;

export interface CombatProfileAutoAttackState {
  readonly mode: CombatProfileAutoAttackMode;
  readonly selectedProfileId?: string;
}

export interface CombatProfileLibrary {
  readonly version: typeof COMBAT_PROFILE_LIBRARY_VERSION;
  readonly profiles: readonly CombatProfile[];
  readonly autoAttack: CombatProfileAutoAttackState;
}

const profileIdPattern = /^[a-z0-9][a-z0-9._-]*$/u;
const MAX_DELAY_MS = 60_000;
const MAX_TIMEOUT_MS = 60_000;
const MAX_LABEL_LENGTH = 80;
const MAX_ROLE_LENGTH = 40;
const MAX_CLASS_NAME_LENGTH = 80;
const MAX_AURA_NAME_LENGTH = 80;
const MAX_ANIMATION_TRIGGER_TEXT_LENGTH = 160;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCooldownMode = (value: unknown): value is CombatProfileCooldownMode =>
  typeof value === "string" &&
  CombatProfileCooldownModes.includes(value as CombatProfileCooldownMode);

const isAutoAttackMode = (
  value: unknown,
): value is CombatProfileAutoAttackMode =>
  typeof value === "string" &&
  CombatProfileAutoAttackModes.includes(value as CombatProfileAutoAttackMode);

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const clampInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
};

const trimString = (value: unknown, maxLength: number): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed.slice(0, maxLength);
};

export const normalizeCombatProfileClassName = (value: string): string =>
  value.trim().replace(/\s+/gu, " ").toLowerCase();

export const makeCombatProfileId = (label: string): string => {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/['"]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return normalized === "" ? "profile" : normalized;
};

const normalizeProfileId = (
  value: unknown,
  fallbackLabel: string,
  reservedIds: ReadonlySet<string>,
): string => {
  const explicit = trimString(value, 80);
  const base =
    explicit !== undefined && profileIdPattern.test(explicit)
      ? explicit
      : makeCombatProfileId(fallbackLabel);

  if (!reservedIds.has(base)) {
    return base;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!reservedIds.has(candidate)) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
};

const normalizeComparison = (value: unknown): CombatProfileComparison =>
  value === ">=" ? ">=" : "<=";

const normalizeThresholdUnit = (value: unknown): CombatProfileThresholdUnit =>
  value === "value" ? "value" : "percent";

const normalizeCondition = (
  value: unknown,
): CombatProfileCondition | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  if (
    value["type"] === "self-hp" ||
    value["type"] === "self-mp" ||
    value["type"] === "ally-hp"
  ) {
    const unit = normalizeThresholdUnit(value["unit"]);
    return {
      type: value["type"],
      op: normalizeComparison(value["op"]),
      unit,
      value: clampInt(value["value"], 0, 0, unit === "percent" ? 100 : 999_999),
    };
  }

  if (value["type"] === "self-aura" || value["type"] === "target-aura") {
    const auraName = trimString(value["auraName"], MAX_AURA_NAME_LENGTH);
    if (auraName === undefined) {
      return undefined;
    }

    return {
      type: value["type"],
      auraName,
      op: normalizeComparison(value["op"]),
      value: clampInt(value["value"], 0, 0, 999),
    };
  }

  return undefined;
};

const normalizeStep = (
  value: unknown,
  index: number,
): CombatProfileStep | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const skill = clampInt(value["skill"], Number.NaN, 0, 5);
  if (!Number.isFinite(skill)) {
    return undefined;
  }

  const conditions = Array.isArray(value["conditions"])
    ? value["conditions"].map(normalizeCondition).filter(isDefined)
    : [];

  const waitMs = clampInt(value["waitMs"], 0, 0, MAX_TIMEOUT_MS);

  return {
    id: trimString(value["id"], 80) ?? `step-${index + 1}`,
    skill,
    conditions,
    ...(isCooldownMode(value["cooldownMode"])
      ? { cooldownMode: value["cooldownMode"] }
      : value["skipIfUnavailable"] === true
        ? { cooldownMode: "use-if-ready" as const }
        : {}),
    ...(waitMs > 0 ? { waitMs } : {}),
  };
};

const normalizeAnimationTrigger = (
  value: unknown,
  index: number,
): CombatProfileAnimationTrigger | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const messageIncludes = trimString(
    value["messageIncludes"],
    MAX_ANIMATION_TRIGGER_TEXT_LENGTH,
  );
  if (messageIncludes === undefined) {
    return undefined;
  }

  const skill = clampInt(value["skill"], Number.NaN, 0, 5);
  if (!Number.isFinite(skill)) {
    return undefined;
  }

  const cooldownMs = clampInt(value["cooldownMs"], 0, 0, MAX_TIMEOUT_MS);

  return {
    id: trimString(value["id"], 80) ?? `trigger-${index + 1}`,
    messageIncludes,
    skill,
    ...(cooldownMs > 0 ? { cooldownMs } : {}),
  };
};

const genericProfile = (): CombatProfile => ({
  id: DEFAULT_COMBAT_PROFILE_ID,
  label: "Generic",
  role: DEFAULT_COMBAT_PROFILE_ROLE,
  delayMs: DEFAULT_COMBAT_PROFILE_DELAY_MS,
  cooldownMode: "use-if-ready",
  timeoutMs: DEFAULT_COMBAT_PROFILE_TIMEOUT_MS,
  steps: [1, 2, 3, 4].map((skill) => ({
    id: `generic-${skill}`,
    skill,
    conditions: [],
  })),
  animationTriggers: [],
});

export const DEFAULT_COMBAT_PROFILE_LIBRARY: CombatProfileLibrary = {
  version: COMBAT_PROFILE_LIBRARY_VERSION,
  profiles: [genericProfile()],
  autoAttack: {
    mode: "equipped-class",
  },
};

export const cloneCombatProfileLibrary = (
  library: CombatProfileLibrary,
): CombatProfileLibrary => ({
  version: library.version,
  profiles: library.profiles.map((profile) => ({
    ...profile,
    steps: profile.steps.map((step) => ({
      ...step,
      conditions: step.conditions.map((condition) => ({ ...condition })),
    })),
    ...(profile.animationTriggers === undefined
      ? {}
      : {
          animationTriggers: profile.animationTriggers.map((trigger) => ({
            ...trigger,
          })),
        }),
  })),
  autoAttack: { ...library.autoAttack },
});

const normalizeProfile = (
  value: unknown,
  reservedIds: Set<string>,
): CombatProfile | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const label = trimString(value["label"], MAX_LABEL_LENGTH) ?? "Profile";
  const id = normalizeProfileId(value["id"], label, reservedIds);
  reservedIds.add(id);

  const className = trimString(value["className"], MAX_CLASS_NAME_LENGTH);
  const role =
    trimString(value["role"], MAX_ROLE_LENGTH) ?? DEFAULT_COMBAT_PROFILE_ROLE;
  const steps = Array.isArray(value["steps"])
    ? value["steps"].map(normalizeStep).filter(isDefined)
    : [];
  const animationTriggers = Array.isArray(value["animationTriggers"])
    ? value["animationTriggers"]
        .map(normalizeAnimationTrigger)
        .filter(isDefined)
    : [];

  return {
    id,
    label,
    ...(className === undefined ? {} : { className }),
    role,
    delayMs: clampInt(
      value["delayMs"],
      DEFAULT_COMBAT_PROFILE_DELAY_MS,
      0,
      MAX_DELAY_MS,
    ),
    cooldownMode: isCooldownMode(value["cooldownMode"])
      ? value["cooldownMode"]
      : "use-if-ready",
    timeoutMs: clampInt(
      value["timeoutMs"],
      DEFAULT_COMBAT_PROFILE_TIMEOUT_MS,
      0,
      MAX_TIMEOUT_MS,
    ),
    steps:
      steps.length > 0
        ? steps
        : genericProfile().steps.map((step) => ({ ...step })),
    ...(animationTriggers.length === 0 ? {} : { animationTriggers }),
  };
};

const normalizeAutoAttackState = (
  value: unknown,
  profileIds: ReadonlySet<string>,
): CombatProfileAutoAttackState => {
  if (!isRecord(value)) {
    return DEFAULT_COMBAT_PROFILE_LIBRARY.autoAttack;
  }

  const mode = isAutoAttackMode(value["mode"])
    ? value["mode"]
    : "equipped-class";
  const selectedProfileId = trimString(value["selectedProfileId"], 80);

  if (
    mode === "selected" &&
    selectedProfileId !== undefined &&
    profileIds.has(selectedProfileId)
  ) {
    return { mode, selectedProfileId };
  }

  return { mode: mode === "selected" ? "equipped-class" : mode };
};

export const parseCombatProfileAutoAttackState = (
  value: unknown,
  profileIds: ReadonlySet<string>,
): CombatProfileAutoAttackState => {
  if (!isRecord(value) || !isAutoAttackMode(value["mode"])) {
    throw new Error("Auto attack state mode is invalid");
  }

  if (value["mode"] !== "selected") {
    return { mode: value["mode"] };
  }

  const selectedProfileId = trimString(value["selectedProfileId"], 80);
  if (selectedProfileId === undefined || !profileIds.has(selectedProfileId)) {
    throw new Error("Selected combat profile does not exist");
  }

  return { mode: "selected", selectedProfileId };
};

export const normalizeCombatProfileLibrary = (
  value: unknown,
): CombatProfileLibrary => {
  const reservedIds = new Set<string>();
  const rawProfiles =
    isRecord(value) && Array.isArray(value["profiles"])
      ? value["profiles"]
      : [];
  const profiles = rawProfiles
    .map((profile) => normalizeProfile(profile, reservedIds))
    .filter(isDefined);

  if (!profiles.some((profile) => profile.id === DEFAULT_COMBAT_PROFILE_ID)) {
    profiles.unshift(genericProfile());
    reservedIds.add(DEFAULT_COMBAT_PROFILE_ID);
  }

  const profileIds = new Set(profiles.map((profile) => profile.id));
  return {
    version: COMBAT_PROFILE_LIBRARY_VERSION,
    profiles,
    autoAttack: normalizeAutoAttackState(
      isRecord(value) ? value["autoAttack"] : undefined,
      profileIds,
    ),
  };
};

export const findCombatProfileByRef = (
  library: CombatProfileLibrary,
  ref: CombatProfileRef,
  equippedClassName?: string,
): CombatProfile => {
  const fallback =
    library.profiles.find(
      (profile) => profile.id === DEFAULT_COMBAT_PROFILE_ID,
    ) ?? genericProfile();

  if (ref === "generic") {
    return fallback;
  }

  if (ref === "equipped-class") {
    const normalizedClassName =
      equippedClassName === undefined
        ? undefined
        : normalizeCombatProfileClassName(equippedClassName);
    if (normalizedClassName === undefined || normalizedClassName === "") {
      return fallback;
    }

    return (
      library.profiles.find(
        (profile) =>
          profile.className !== undefined &&
          normalizeCombatProfileClassName(profile.className) ===
            normalizedClassName,
      ) ?? fallback
    );
  }

  return (
    library.profiles.find((profile) => profile.id === ref.profileId) ?? fallback
  );
};

export const autoAttackStateToProfileRef = (
  state: CombatProfileAutoAttackState,
): CombatProfileRef => {
  if (state.mode === "generic") {
    return "generic";
  }

  if (state.mode === "selected" && state.selectedProfileId !== undefined) {
    return { mode: "selected", profileId: state.selectedProfileId };
  }

  return "equipped-class";
};
