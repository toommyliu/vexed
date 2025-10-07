import type { Bot } from "@lib/Bot";
import type { Aura } from "@lib/models/BaseEntity";
import { AuraStore } from "@lib/util/AuraStore";

const ADD_AURAS = new Set(["aura+", "aura++"]);
const REMOVE_AURAS = new Set(["aura-", "aura--"]);

// "Combat Tick"
export function ct(bot: Bot, packet: CtPacket) {
  bot.emit("ct", packet);

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
      if (!data) continue;

      const hp = data.intHP!;
      const mp = data.intMP!;
      const state = data.intState!;

      if (bot.auth?.username?.toLowerCase() === playerName.toLowerCase()) {
        bot.player.hp = hp ?? bot.player.hp;
        bot.player.mp = mp ?? bot.player.mp;
        bot.player.state = state;
      }

      if (hp === 0 && state === 0) {
        bot.emit("playerDeath", playerName);
        AuraStore.playerAuras.delete(playerName);
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

            if ("val" in aura_) {
              if (typeof aura_.val === "number") data.value = aura_.val;
              // else {
              //   console.log(
              //     "(1) unexpected aura val type:",
              //     typeof aura_.val,
              //     aura_.val,
              //   );
              // }

              if (data.isNew) AuraStore.addMonsterAura(tgtId, data);
              else AuraStore.refreshMonsterAura(tgtId, data);
            }
          }
        } else if (type === "p") {
          const username = [...bot.world.playerUids].find(
            ([, uid]) => uid === Number(tgtId),
          )?.[0];
          if (!username) continue;

          for (const aura_ of aura?.auras ?? []) {
            const data: Aura = {
              name: aura_.nam,
              duration: aura_.dur ?? 0,
              isNew: aura_?.isNew || false,
            };

            if ("val" in aura_) {
              if (typeof aura_.val === "number") data.value = aura_.val;
              // else {
              //   console.log(
              //     "(2) unexpected aura val type:",
              //     typeof aura_.val,
              //     aura_.val,
              //     "aura obj:",
              //     aura_,
              //   );
              // }

              if (data.isNew) AuraStore.addPlayerAura(username, data);
              else AuraStore.refreshPlayerAura(username, data);
            }
          }
        }
      } else if (REMOVE_AURAS.has(aura.cmd)) {
        const auraName = aura?.aura?.nam;
        if (!auraName) continue;

        if (type === "m") {
          AuraStore.removeMonsterAura(tgtId, auraName);

          if (auraName === "Counter Attack" && bot.settings.counterAttack) {
            bot.combat.attack(`id:${tgtId}`);
            bot.combat.pauseAttack = false;
          }
        } else if (type === "p") {
          const username = [...bot.world.playerUids].find(
            ([, uid]) => uid === Number(tgtId),
          )?.[0];
          if (!username) continue;

          AuraStore.removePlayerAura(username, auraName);
        }
      }
    }
  }
}

export type CtPacket = {
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
  m?: {
    [monMapId: number]: {
      intHP?: number;
      intState?: number;
    };
  };
  p?: {
    [playerName: string]: {
      intHP?: number;
      intMP?: number;
      intState?: number;
    };
  };
};
