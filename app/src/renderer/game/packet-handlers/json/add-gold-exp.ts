import type { Bot } from "@lib/Bot";
import { AuraStore } from "@lib/util/AuraStore";

const isMonPkt = (
  packet: AddGoldExpPkt,
): packet is AddGoldExpPkt & AddGoldExpPktMon => packet.typ === "m";

export async function addGoldExp(bot: Bot, packet: AddGoldExpPkt) {
  const totalGold = packet.intGold + (packet.bonusGold ?? 0);
  if (totalGold > 0) {
    bot.player.gold += totalGold;
  }

  if (isMonPkt(packet)) {
    bot.emit("monsterDeath", packet.id);

    AuraStore.clearMonsterAuras(String(packet.id));

    const mon = bot.world.availableMonsters.get(packet.id);
    if (!mon) return;

    mon.data.intHP = 0;
    mon.data.intState = 0;
  }
}

type AddGoldExpPktMon = {
  id: number; // monMapId
  typ: "m";
};

type AddGoldExpPktQuest = {
  typ: "q";
};

export type AddGoldExpPkt = {
  bonusGold?: number;
  cmd: "addGoldExp";
  intExp: number;
  intGold: number;
} & (AddGoldExpPktMon | AddGoldExpPktQuest);
