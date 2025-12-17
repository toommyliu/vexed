import { QuestCache } from "~/lib/cache/QuestCache";
import type { QuestData } from "~/lib/models/Quest";
import type { JsonPacketHandler } from "../types";

type GetQuestsData = {
  quests: Record<string, QuestData>;
};

export default {
  cmd: "getQuests",
  type: "json",
  run: (_bot, data) => {
    if (!data.quests) return;

    for (const [questId, questData] of Object.entries(data.quests))
      QuestCache.set(Number(questId), questData);
  },
} satisfies JsonPacketHandler<GetQuestsData>;
