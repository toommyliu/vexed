import { EntityState } from "@vexed/game";
import { registerStrHandler } from "../registry";

registerStrHandler("respawnMon", async (bot, packet) => {
  const monMapId = Number(packet[2]);
  const monster = bot.world.monsters.get(monMapId);
  if (!monster) return;

  monster.data.intHP = monster.data.intHPMax;
  monster.data.intMP = monster.data.intMPMax;
  monster.data.intState = EntityState.Idle;
});
