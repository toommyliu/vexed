import type { StrPacketHandler } from "../types";

export default {
  cmd: "respawnMon",
  type: "str",
  run: (bot, data) => {
    const monMapId = Number(data[2]);
    if (Number.isNaN(monMapId)) return;

    const monster = bot.world.availableMonsters.find(
      (mon) => mon.monMapId === monMapId,
    );
    if (monster) {
      bot.emit("monsterRespawn", monster);
    }
  },
} satisfies StrPacketHandler;
