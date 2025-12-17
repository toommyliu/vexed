import { AuraCache } from "~/lib/cache/AuraCache";
import type { JsonPacketHandler } from "../types";

type AddGoldExpData = {
  bonusGold?: number;
  cmd: "addGoldExp";
  intExp: number;
  intGold: number;
} & ({ id: number; typ: "m" } | { typ: "q" });

function isMonsterPacket(
  data: AddGoldExpData,
): data is AddGoldExpData & { id: number; typ: "m" } {
  return data.typ === "m";
}

export default {
  cmd: "addGoldExp",
  type: "json",
  run: (bot, data) => {
    if (isMonsterPacket(data)) {
      bot.emit("monsterDeath", data.id);
      AuraCache.monsterAuras.delete(String(data.id));
    }
  },
} satisfies JsonPacketHandler<AddGoldExpData>;
