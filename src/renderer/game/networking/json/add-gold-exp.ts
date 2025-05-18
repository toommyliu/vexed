import type { Bot } from "../../lib/Bot";

function isMonPkt(
  packet: AddGoldExpPkt,
): packet is AddGoldExpPkt & AddGoldExpPktMon {
  return packet.typ === "m";
}

export async function addGoldExp(bot: Bot, packet: AddGoldExpPkt) {
  if (isMonPkt(packet)) {
    const getMonster = () =>
      bot.world.availableMonsters.find((mon) => mon.monMapId === packet.id)!;

    bot.emit("monsterDeath", packet.id);
    await bot.waitUntil(() => Boolean(getMonster()?.alive));
    bot.emit("monsterRespawn", getMonster());
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
