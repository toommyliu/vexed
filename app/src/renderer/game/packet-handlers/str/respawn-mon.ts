import type { Bot } from "@lib/Bot";
import { AuraStore } from "@lib/util/AuraStore";

export function respawnMon(bot: Bot, args: ["respawnMon", string, string]) {
  const monMapId = args[args.length - 1]!;

  const mon = bot.world.monsters.get(Number(monMapId));
  if (!mon) return;

  AuraStore.clearMonsterAuras(monMapId);

  bot.emit("monsterRespawn", mon);

  mon.data.intState = 1;
  mon.data.intHP = mon.data.intHPMax;
}
