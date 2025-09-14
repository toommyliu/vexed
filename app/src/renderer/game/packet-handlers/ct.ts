import type { Bot } from "@lib/Bot";
import { AuraStore } from "@lib/util/AuraStore";

export function ct(bot: Bot, packet: CtPacket, fullPacket: any) {
  // console.log("ct packet", packet);
  // console.log("full packet", fullPacket);

  if (Array.isArray(packet?.anims)) {
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
  }

  // player
  if (typeof packet?.p === "object") {
    for (const [playerName, data] of Object.entries(packet?.p ?? {})) {
      if (data?.intState === 0 && data?.intHP === 0)
        bot.emit("playerDeath", playerName);
    }
  }

  // auras
  if (Array.isArray(packet?.a)) {
    for (const aura of packet?.a ?? []) {
      console.log("aura", aura);
      if (aura?.cmd === "aura+") {
        const tgt = aura?.tInf?.split(":")[1]; // uid
        if (tgt) {
          // get the username (key) from the uid (value)
          const username = [...bot.world.playerUids].find(
            ([, uid]) => uid === Number(tgt),
          )?.[0];
          if (username) {
            for (const a of aura?.auras ?? []) {
              console.log(`adding aura ${a.nam} to ${username}`);
            }
          }
        }
      } else if (aura?.cmd === "aura-") {
      }

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
}

type CtPacket = {
  a?: {
    aura?: {
      nam?: string;
    };
    auras?: {
      dur: number;
      icon: string;
      isNew: boolean;
      nam: string;
      t: string; // ? "s" -> self
    }[];
    cInf?: string; // p:uid
    cmd?: string; // aura+ or aura-
    tInf?: string; // ? the target the aura is applied to
  }[];
  anims?: {
    msg?: string;
  }[];
  p?: {
    // player name
    [key: string]: {
      intHP?: number;
      intMP?: number;
      intState?: number;
    };
  };
};
