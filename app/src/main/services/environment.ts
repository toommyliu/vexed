import { Result } from "better-result";
import {
  EnvironmentMissingGameWindowError,
  EnvironmentMissingSenderError,
  type EnvironmentServiceError,
} from "~/shared/environment/errors";
import {
  createEmptyEnvironmentState,
  normalizeEnvironmentState,
  normalizeEnvironmentUpdate,
} from "~/shared/environment/helpers";
import type {
  EnvironmentState,
  EnvironmentUpdatePayload,
} from "~/shared/environment/types";
import { windowsService } from "./windows";

const states = new Map<number /* windowId */, EnvironmentState>();
const empty = createEmptyEnvironmentState();

function getWindowState(windowId: number): EnvironmentState {
  const existing = states.get(windowId);
  if (existing) return existing;
  states.set(windowId, empty);
  return empty;
}

export const environmentService = {
  getStateForGameWindow(gameWindowId: number): EnvironmentState {
    return getWindowState(gameWindowId);
  },

  getStateForSender(
    senderWindowId: number | null | undefined,
  ): Result<EnvironmentState, EnvironmentServiceError> {
    if (!senderWindowId) {
      return Result.err(
        new EnvironmentMissingSenderError({
          message: "Missing sender window id",
        }),
      );
    }

    const gameWindowId = windowsService.getGameWindowId(senderWindowId);
    if (!gameWindowId) {
      return Result.err(
        new EnvironmentMissingGameWindowError({
          message: "Missing parent game window id",
        }),
      );
    }

    return Result.ok(getWindowState(gameWindowId));
  },

  applyUpdateForSender(
    senderWindowId: number | null | undefined,
    payload: EnvironmentUpdatePayload,
  ): Result<EnvironmentState, EnvironmentServiceError> {
    if (!senderWindowId) {
      return Result.err(
        new EnvironmentMissingSenderError({
          message: "Missing sender window id",
        }),
      );
    }

    const gameWindowId = windowsService.getGameWindowId(senderWindowId);
    if (!gameWindowId) {
      return Result.err(
        new EnvironmentMissingGameWindowError({
          message: "Missing parent game window id",
        }),
      );
    }

    const current = getWindowState(gameWindowId);
    const next = normalizeEnvironmentUpdate(payload, current);
    states.set(gameWindowId, next);
    return Result.ok(next);
  },

  setStateForGameWindow(gameWindowId: number, state: EnvironmentState): void {
    const normalized = normalizeEnvironmentState(state);
    states.set(gameWindowId, normalized);
  },

  clearState(gameWindowId: number): void {
    states.delete(gameWindowId);
  },
};
