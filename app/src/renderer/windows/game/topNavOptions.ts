import type { GameCommandId } from "../../../shared/commands";

export type GameTopNavMenu =
  | "windows"
  | "scripts"
  | "options"
  | "combat"
  | "autozone"
  | "relogin"
  | "pads"
  | "cells";

export interface TopNavOptionItem {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}

export const topNavOptionCommandIds: Partial<Record<GameCommandId, string>> = {
  toggleInfiniteRange: "infinite-range",
  toggleProvokeCell: "provoke-cell",
  toggleEnemyMagnet: "enemy-magnet",
  toggleLagKiller: "lag-killer",
  toggleHidePlayers: "hide-players",
  toggleSkipCutscenes: "skip-cutscenes",
  toggleAntiCounter: "anti-counter",
  toggleDisableFx: "disable-fx",
  toggleCollisions: "collisions",
  toggleDeathAds: "death-ads",
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
