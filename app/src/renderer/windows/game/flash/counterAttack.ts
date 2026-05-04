export type CounterAttackTrigger = {
  readonly id: string;
  readonly messagePatterns: readonly RegExp[];
  readonly auraNames: readonly string[];
  readonly auraPatterns: readonly RegExp[];
  readonly fallbackMs: number; // Fallback duration if not available from aura.
  readonly graceMs: number; // Buffer after packet duration to cover latency and delayed aura removal.
};

export type CounterAttackMatch = {
  readonly trigger: CounterAttackTrigger;
  readonly triggerId: string;
  readonly triggerText: string;
};

const normalizeText = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export const counterAttackTriggers: readonly CounterAttackTrigger[] = [
  {
    id: "counter-attack",
    messagePatterns: [
      /prepares\s+a\s+counter\s+attack/i,
    ],
    auraNames: ["Counter Attack"],
    auraPatterns: [/\bcounter\b.*\battack\b/i],
    fallbackMs: 7_000,
    graceMs: 750,
  },
];

const defaultTrigger = counterAttackTriggers[0]!;

const getTriggerById = (triggerId: string): CounterAttackTrigger =>
  counterAttackTriggers.find((trigger) => trigger.id === triggerId) ??
  defaultTrigger;

export const matchCounterAttackMessage = (
  message: string,
): CounterAttackMatch | undefined => {
  const normalizedMessage = normalizeText(message);

  for (const trigger of counterAttackTriggers) {
    if (
      trigger.messagePatterns.some((pattern) => pattern.test(normalizedMessage))
    ) {
      return {
        trigger,
        triggerId: trigger.id,
        triggerText: message,
      };
    }
  }

  return undefined;
};

export const matchCounterAttackAura = (
  name: string,
): CounterAttackMatch | undefined => {
  const normalizedName = normalizeText(name);

  for (const trigger of counterAttackTriggers) {
    if (
      trigger.auraNames.some(
        (auraName) => normalizeText(auraName) === normalizedName,
      )
    ) {
      return {
        trigger,
        triggerId: trigger.id,
        triggerText: name,
      };
    }
  }

  for (const trigger of counterAttackTriggers) {
    if (trigger.auraPatterns.some((pattern) => pattern.test(normalizedName))) {
      return {
        trigger,
        triggerId: trigger.id,
        triggerText: name,
      };
    }
  }

  return undefined;
};

export const durationMsFromAura = (duration?: number): number | undefined => {
  if (duration === undefined || !Number.isFinite(duration) || duration <= 0) {
    return undefined;
  }

  return duration * 1_000;
};

export const expiresAtMs = (
  match: Pick<CounterAttackMatch, "triggerId">,
  durationMs?: number,
): number => {
  const trigger = getTriggerById(match.triggerId);
  const activeMs =
    durationMs !== undefined && Number.isFinite(durationMs) && durationMs > 0
      ? durationMs
      : trigger.fallbackMs;

  return Date.now() + activeMs + trigger.graceMs;
};
