import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface QuestsShape {
  abandon(questId: number): BridgeEffect<void>;
  accept(questId: number): BridgeEffect<void>;
  canComplete(questId: number): BridgeEffect<boolean>;
  complete(
    questId: number,
    turnIns?: number,
    itemId?: number,
    special?: boolean,
  ): BridgeEffect<void>;
  get(questId: number): BridgeEffect<void>;
  getMultiple(questIds: string): BridgeEffect<void>;
  getQuestValidationString(
    questObj: Record<string, unknown>,
  ): BridgeEffect<string>;
  getTree(): BridgeEffect<unknown[]>;
  hasRequiredItemsForQuest(
    questObj: Record<string, unknown>,
  ): BridgeEffect<boolean>;
  isAvailable(questId: number): BridgeEffect<boolean>;
  isInProgress(questId: number): BridgeEffect<boolean>;
  isOneTimeQuestDone(questId: number): BridgeEffect<boolean>;
  load(questId: number): BridgeEffect<void>;
}

export class Quests extends ServiceMap.Service<Quests, QuestsShape>()(
  "flash/Services/Quests",
) {}
