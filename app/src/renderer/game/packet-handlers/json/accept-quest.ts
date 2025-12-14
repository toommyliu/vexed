import type { Bot } from "@lib/Bot";

export function acceptQuest(bot: Bot, packet: AcceptQuestPacket) {
  bot.quests._acceptQuest(packet);
}

export type AcceptQuestPacket = {
  QuestID: number;
  bSuccess: number;
  cmd: "acceptQuest";
  msg: string;
};

// {"t":"xt","b":{"r":-1,"o":{"cmd":"acceptQuest","bSuccess":1,"QuestID":6,"msg":"success"}}}
