import type { Bot } from "@lib/Bot";
import type { QuestData } from "@lib/models/Quest";

export function getQuests(bot: Bot, packet: GetQuestsPacket) {
  bot.quests._getQuests(packet);
}

export type GetQuestsPacket = {
  cmd: "getQuests";
  quests: Record<number, QuestData>;
};
