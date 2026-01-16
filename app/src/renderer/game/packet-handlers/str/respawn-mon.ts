import { EntityState } from "@vexed/game";
import { registerStrHandler } from "../registry";

registerStrHandler("respawnMon", async (bot, packet) => {
  const monMapId = Number(packet[2]);
  const monster = bot.world.monsters.get(monMapId);
  if (!monster) return;

  monster.data.intHp = monster.data.intHpMax;
  monster.data.intMp = monster.data.intMpMax;
  monster.data.intState = EntityState.Idle;
  monster.clearAuras();

  bot.emit("monsterRespawn", monster);
});
