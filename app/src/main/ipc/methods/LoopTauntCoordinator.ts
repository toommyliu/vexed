import {
  type ArmyLoopTauntCommandPayload,
  type ArmyLoopTauntObservationPayload,
  type ArmyLoopTauntParticipantPayload,
  type ArmyLoopTauntStartPayload,
  type ArmyLoopTauntStopPayload,
} from "../../../shared/ipc";
import {
  DEFAULT_LOOP_TAUNT_CAST_SETTLE_MS,
  LOOP_TAUNT_FOCUS_AURA_ICON,
  LOOP_TAUNT_FOCUS_AURA_NAME,
  LOOP_TAUNT_RETRY_SETTLE_MS,
  LOOP_TAUNT_SHORT_RETRY_MS,
} from "../../../shared/loop-taunt";

type LoopTauntPhase = "idle" | "settling" | "retry-wait" | "retry-settling";

interface LoopTauntState {
  readonly id: string;
  readonly aura: string;
  readonly delayMs: number;
  readonly skill: number | string;
  readonly targetMonMapId: number;
  readonly participants: readonly ArmyLoopTauntParticipantPayload[];
  readonly registeredPlayerKeys: Set<string>;
  readonly timers: Set<ReturnType<typeof setTimeout>>;
  currentSelected: ArmyLoopTauntParticipantPayload | undefined;
  epoch: number;
  nextIndex: number;
  phase: LoopTauntPhase;
  targetAuraActive: boolean;
}

export interface LoopTauntCoordinatorOptions {
  readonly sessionId: string;
  readonly sendCommand: (
    player: ArmyLoopTauntParticipantPayload,
    command: ArmyLoopTauntCommandPayload,
  ) => void;
}

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const isFocusAura = (aura: string): boolean =>
  normalizeKey(aura) === normalizeKey(LOOP_TAUNT_FOCUS_AURA_NAME);

const matchesAuraObservation = (
  state: LoopTauntState,
  observation: ArmyLoopTauntObservationPayload,
): boolean => {
  if (observation.targetMonMapId !== state.targetMonMapId) {
    return false;
  }

  if (
    observation.auraName !== undefined &&
    normalizeKey(observation.auraName) !== normalizeKey(state.aura)
  ) {
    return false;
  }

  return (
    !isFocusAura(state.aura) ||
    observation.auraIcon === undefined ||
    observation.auraIcon === LOOP_TAUNT_FOCUS_AURA_ICON
  );
};

const clearTimers = (state: LoopTauntState): void => {
  for (const timer of state.timers) {
    clearTimeout(timer);
  }
  state.timers.clear();
};

const resetTurn = (state: LoopTauntState): void => {
  state.phase = "idle";
  state.currentSelected = undefined;
};

export class LoopTauntCoordinator {
  private readonly loops = new Map<string, LoopTauntState>();

  public constructor(private readonly options: LoopTauntCoordinatorOptions) {}

  public clear(): void {
    for (const state of this.loops.values()) {
      clearTimers(state);
    }
    this.loops.clear();
  }

  public start(payload: ArmyLoopTauntStartPayload): void {
    const playerKey = normalizeKey(payload.playerName);
    const existing = this.loops.get(payload.id);
    if (existing) {
      existing.registeredPlayerKeys.add(playerKey);
      return;
    }

    this.loops.set(payload.id, {
      aura: payload.aura,
      currentSelected: undefined,
      delayMs: payload.delayMs,
      epoch: 0,
      id: payload.id,
      nextIndex: 0,
      participants: payload.participants,
      phase: "idle",
      registeredPlayerKeys: new Set([playerKey]),
      skill: payload.skill,
      targetAuraActive: true,
      targetMonMapId: payload.targetMonMapId,
      timers: new Set(),
    });
  }

  public stop(payload: ArmyLoopTauntStopPayload): void {
    const state = this.loops.get(payload.id);
    if (!state) {
      return;
    }

    state.registeredPlayerKeys.delete(normalizeKey(payload.playerName));
    if (state.registeredPlayerKeys.size === 0) {
      clearTimers(state);
      this.loops.delete(payload.id);
    }
  }

  public observe(payload: ArmyLoopTauntObservationPayload): void {
    const state = this.loops.get(payload.id);
    if (!state || !matchesAuraObservation(state, payload)) {
      return;
    }

    if (payload.epoch !== undefined && payload.epoch < state.epoch) {
      return;
    }

    if (payload.type === "aura-added") {
      state.targetAuraActive = true;
      clearTimers(state);
      resetTurn(state);
      return;
    }

    if (payload.type !== "aura-missing" && payload.type !== "aura-removed") {
      return;
    }

    if (state.phase !== "idle") {
      return;
    }

    state.targetAuraActive = false;
    this.startTurn(state, payload.type);
  }

  private schedule(
    state: LoopTauntState,
    delayMs: number,
    callback: () => void,
  ): void {
    const timer = setTimeout(() => {
      state.timers.delete(timer);
      callback();
    }, Math.max(0, Math.trunc(delayMs)));
    state.timers.add(timer);
  }

  private sendCommand(
    state: LoopTauntState,
    attempt: number,
    reason: string,
  ): void {
    const selected = state.currentSelected;
    if (!selected) {
      return;
    }

    this.options.sendCommand(selected, {
      attempt,
      epoch: state.epoch,
      id: state.id,
      reason,
      selected,
      sessionId: this.options.sessionId,
      skill: state.skill,
      targetMonMapId: state.targetMonMapId,
    });
  }

  private startTurn(state: LoopTauntState, reason: string): void {
    if (state.participants.length === 0 || state.phase !== "idle") {
      return;
    }

    clearTimers(state);
    state.epoch += 1;
    state.phase = "settling";
    state.targetAuraActive = false;

    const selectedIndex = state.nextIndex % state.participants.length;
    state.currentSelected = state.participants[selectedIndex];
    state.nextIndex = (selectedIndex + 1) % state.participants.length;

    const epoch = state.epoch;
    this.schedule(state, state.delayMs, () => {
      if (state.epoch !== epoch || state.phase !== "settling") {
        return;
      }

      this.sendCommand(state, 1, reason);
      this.schedule(state, DEFAULT_LOOP_TAUNT_CAST_SETTLE_MS, () => {
        if (state.epoch !== epoch || state.phase !== "settling") {
          return;
        }

        if (state.targetAuraActive) {
          resetTurn(state);
          return;
        }

        state.phase = "retry-wait";
        this.schedule(state, LOOP_TAUNT_SHORT_RETRY_MS, () => {
          if (state.epoch !== epoch || state.phase !== "retry-wait") {
            return;
          }

          state.phase = "retry-settling";
          this.sendCommand(state, 2, "missed cast retry");
          this.schedule(state, LOOP_TAUNT_RETRY_SETTLE_MS, () => {
            if (state.epoch !== epoch || state.phase !== "retry-settling") {
              return;
            }

            if (state.targetAuraActive) {
              resetTurn(state);
              return;
            }

            resetTurn(state);
            this.startTurn(state, "missed cast recovery expired");
          });
        });
      });
    });
  }
}
