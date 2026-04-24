import { Collection } from "@vexed/collection";
import { ServiceMap } from "effect";
import type { Effect } from "effect";
import type { BridgeEffect } from "./Bridge";
import type { Quest } from "@vexed/game";

export interface QuestsShape {
  abandon(questId: number): BridgeEffect<void>;
  accept(questId: number, silent?: boolean): BridgeEffect<void>;
  canComplete(questId: number): BridgeEffect<boolean>;
  complete(
    questId: number,
    turnIns?: number,
    itemId?: number,
    special?: boolean,
  ): BridgeEffect<void>;
  load(questId: number, silent?: boolean): BridgeEffect<void>;
  loadMany(questIds: number[], silent?: boolean): BridgeEffect<void>;
  getTree(): Effect.Effect<Collection<number, Quest>>;
  has(questId: number): Effect.Effect<boolean>;
  getAccepted(): BridgeEffect<Quest[]>;
  isAvailable(questId: number): BridgeEffect<boolean>;
  isInProgress(questId: number): BridgeEffect<boolean>;
}

export class Quests extends ServiceMap.Service<Quests, QuestsShape>()(
  "flash/Services/Quests",
) {}
