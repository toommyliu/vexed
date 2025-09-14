import type { Bot } from "@lib/Bot";
import { AuraStore } from "@lib/util/AuraStore";
import type { Aura } from "../lib/models/BaseEntity";

export function ct(bot: Bot, packet: CtPacket) {
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
      // console.log("aura", aura);
      if (aura?.cmd === "aura+") {
        const tgtId = aura?.tInf?.split(":")[1]; // uid / monMapId
        if (!tgtId) continue;

        if (aura?.tInf?.startsWith("m")) {
          // console.log("aura+ cmd on monster:", aura);

          for (const a of aura?.auras ?? []) {
            const data: Aura = {
              name: a.nam,
            };

            if ("val" in a && typeof a.val === "number") data.value = a.val;
            // console.log(`Monster ${tgtId} gained aura:`, data);
            AuraStore.addMonsterAura(tgtId, data);
          }
        } else if (aura?.tInf?.startsWith("p")) {
          // get the username (key) from the uid (value)
          const username = [...bot.world.playerUids].find(
            ([, uid]) => uid === Number(tgtId),
          )?.[0];
          if (!username) continue;

          for (const a of aura?.auras ?? []) {
            const data: Aura = {
              name: a.nam,
            };
            if ("val" in a && typeof a.val === "number") data.value = a.val;
            // console.log(`${username} gained aura:`, data);
            AuraStore.addPlayerAura(username, data);
          }
        }
      } else if (aura?.cmd === "aura-") {
        // console.log("aura- cmd");
        const tgtId = aura?.tInf?.split(":")[1]; // uid
        if (!tgtId) continue;

        if (aura?.tInf?.startsWith("m")) {
          // console.log("aura- cmd on monster:", aura);

          if (aura?.aura?.nam) {
            // console.log(`Monster ${tgtId} lost aura:`, aura?.aura?.nam);
            AuraStore.removeMonsterAura(tgtId, aura?.aura?.nam);
          }
        } else if (aura?.tInf?.startsWith("p")) {
          // get the username (key) from the uid (value)
          const username = [...bot.world.playerUids].find(
            ([, uid]) => uid === Number(tgtId),
          )?.[0];
          if (!username) continue;

          // console.log("aura- cmd: subauras", aura?.aura);
          if (aura?.aura?.nam) {
            // console.log(`${username} lost aura:`, aura?.aura?.nam);
            AuraStore.removePlayerAura(username, aura?.aura?.nam);
          }
        }
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
    cInf?: string; // p:uid ? the uid of the player that the applied the aura
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
