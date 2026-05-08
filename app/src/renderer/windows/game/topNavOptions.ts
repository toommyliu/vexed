import type { GameCommandId } from "../../../shared/commands";

export type GameTopNavMenu =
  | "windows"
  | "scripts"
  | "options"
  | "relogin"
  | "pads"
  | "cells";

export interface TopNavOptionItem {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onSelect: () => void;
}

export const topNavOptionCommandIds: Partial<Record<GameCommandId, string>> = {
  "toggle-infinite-range": "infinite-range",
  "toggle-provoke-cell": "provoke-cell",
  "toggle-enemy-magnet": "enemy-magnet",
  "toggle-lag-killer": "lag-killer",
  "toggle-hide-players": "hide-players",
  "toggle-skip-cutscenes": "skip-cutscenes",
  "toggle-disable-fx": "disable-fx",
  "toggle-collisions": "collisions",
  "toggle-death-ads": "death-ads",
};

const commandIdsByOptionId = new Map<string, GameCommandId>(
  Object.entries(topNavOptionCommandIds).map(([commandId, optionId]) => [
    optionId,
    commandId as GameCommandId,
  ]),
);

export const getTopNavOptionCommandId = (
  optionId: string,
): GameCommandId | undefined => commandIdsByOptionId.get(optionId);

export const findTopNavOption = (
  options: readonly TopNavOptionItem[],
  commandId: GameCommandId,
): TopNavOptionItem | undefined => {
  const optionId = topNavOptionCommandIds[commandId];
  return optionId
    ? options.find((option) => option.id === optionId)
    : undefined;
};
