import type { Bot } from "~/lib/Bot";
import type { Aura } from "~/lib/models/BaseEntity";
import { AuraCache } from "~/lib/cache/AuraCache";

const ADD_AURAS = new Set(["aura+", "aura++"]);
const REMOVE_AURAS = new Set(["aura-", "aura--"]);

// "Combat Tick"
export function ct(bot: Bot, packet: CtPacket) {
  if (Array.isArray(packet?.anims) && packet?.anims?.length) {
    for (const anim of packet?.anims ?? []) {
      if (!anim?.msg) continue;

      // ["The remaining Grace Crystal is unstable", " destroy it quickly!"]
      if (Array.isArray(anim?.msg)) {
        anim.msg = anim?.msg.join("...  ");
      }

      if (anim?.msg) {
        // @ts-expect-error don't care
        bot.emit("ctMessage", anim?.msg, anim);
      }

      if (
        anim?.msg?.toLowerCase()?.includes("prepares a counter attack") &&
        bot.settings.counterAttack
      ) {
        bot.combat.cancelTarget();
        bot.combat.cancelAutoAttack();
        bot.combat.pauseAttack = true;
      }
    }
  }

  // player
  if (typeof packet?.p === "object") {
    for (const playerName in packet.p) {
      if (!Object.hasOwn(packet.p, playerName)) continue;
      const data = packet.p[playerName];
      if (data?.intState === 0 && data?.intHP === 0) {
        bot.emit("playerDeath", playerName);
        const entId = AuraCache.getPlayerEntId(playerName);
        if (entId !== undefined) AuraCache.clearPlayerAuras(entId);
      }
    }
  }

  // auras
  if (Array.isArray(packet?.a)) {
    for (const aura of packet?.a ?? []) {
      if (!aura?.cmd) continue;

      const parts = aura?.tInf?.split(":");
      const type = parts?.[0] as "m" | "p" | undefined;
      const tgtId = parts?.[1] as string | undefined;

      if (!type || !tgtId) continue;

      if (ADD_AURAS.has(aura.cmd)) {
        if (type === "m") {
          for (const aura_ of aura?.auras ?? []) {
            const data: Aura = {
              name: aura_.nam,
              duration: aura_.dur ?? 0,
              isNew: aura_?.isNew || false,
            };

            if ("val" in aura_ && typeof aura_.val === "number") {
              data.value = aura_.val;
            }

            if (data.isNew) AuraCache.addMonsterAura(tgtId, data);
            else AuraCache.refreshMonsterAura(tgtId, data);
          }
        } else if (type === "p") {
          const entId = Number(tgtId);

          for (const aura_ of aura?.auras ?? []) {
            const data: Aura = {
              name: aura_.nam,
              duration: aura_.dur ?? 0,
              isNew: aura_?.isNew || false,
            };

            if ("val" in aura_ && typeof aura_.val === "number") {
              data.value = aura_.val;
            }

            if (data.isNew) AuraCache.addPlayerAura(entId, data);
            else AuraCache.refreshPlayerAura(entId, data);
          }
        }
      } else if (REMOVE_AURAS.has(aura.cmd)) {
        const auraName = aura?.aura?.nam;
        if (!auraName) continue;

        if (type === "m") {
          AuraCache.removeMonsterAura(tgtId, auraName);

          if (auraName === "Counter Attack" && bot.settings.counterAttack) {
            bot.combat.attack(`id:${tgtId}`);
            bot.combat.pauseAttack = false;
          }
        } else if (type === "p") {
          AuraCache.removePlayerAura(Number(tgtId), auraName);
        }
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
    cmd?: string; // aura+ or aura-, aura++/aura-- for server messages?
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
