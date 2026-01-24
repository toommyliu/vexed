import { EntityState } from "@vexed/game";
import { auras } from "../../lib/stores/aura";
import { registerJsonHandler } from "../registry";

function isMonPkt(
  packet: AddGoldExpPkt,
): packet is AddGoldExpPkt & AddGoldExpPktMon {
  return packet.typ === "m";
}

registerJsonHandler<AddGoldExpPkt>("addGoldExp", async (bot, packet) => {
  if (isMonPkt(packet)) {
    const monMapId = packet.id;
    const monster = bot.world.monsters.get(monMapId);
    if (!monster) return;

    bot.emit("monsterDeath", monMapId);

    auras.monsters.clearTarget(monMapId);
    monster.data.intState = EntityState.Dead;
    monster.data.intHP = 0;
    monster.data.intMP = 0;
  }
});

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
