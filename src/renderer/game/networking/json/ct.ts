import type { Bot } from "../../lib/Bot";

export function ct(bot: Bot, packet: CtPacket) {
  for (const anim of packet?.anims ?? []) {
    if (
      anim?.msg?.toLowerCase()?.includes("prepares a counter attack") &&
      bot.settings.counterAttack
    ) {
      bot.combat.cancelTarget();
      bot.combat.cancelAutoAttack();
      bot.combat.pauseAttack = true;
      break;
    }
  }

  for (const aura of packet?.a ?? []) {
    if (
      aura?.cmd === "aura--" &&
      aura?.aura?.nam === "Counter Attack" &&
      bot.settings.counterAttack
    ) {
      const monMapID = aura!.tInf!.split(":")[1];
      bot.combat.attack(`id:${monMapID}`);
      bot.combat.pauseAttack = false;
      break;
    }
  }
}

type CtPacket = {
  a?: {
    aura?: {
      nam?: string;
    };
    cmd?: string;
    tInf?: string;
  }[];
  anims?: {
    msg?: string;
  }[];
};
