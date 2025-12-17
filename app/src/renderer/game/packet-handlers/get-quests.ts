import type { Bot } from "~/lib/Bot";
import type { QuestData } from "~/lib/models/Quest";
import { QuestCache } from "~/lib/cache/QuestCache";

/**
 * Handles the getQuests packet to populate the JS-side quest cache.
 */
export function getQuests(
    _bot: Bot,
    data: { quests: Record<string, QuestData> },
): void {
    if (!data.quests) return;

    for (const [questId, questData] of Object.entries(data.quests)) {
        QuestCache.set(Number(questId), questData);
    }
}
