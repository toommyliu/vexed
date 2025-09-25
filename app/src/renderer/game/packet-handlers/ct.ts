import type { Bot } from "@lib/Bot";
import type { Aura } from "@lib/models/BaseEntity";
import { Monster } from "@lib/models/Monster";
import { AuraStore } from "@lib/util/AuraStore";

// const log = (msg: string) => {
//   console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
// };

export function ct(bot: Bot, packet: CtPacket) {
  if (Array.isArray(packet?.anims) && packet?.anims?.length) {
    for (const anim of packet?.anims ?? []) {
      if (!anim?.msg) continue;

      // console.log("ANIM", anim);

      // ["The remaining Grace Crystal is unstable", " destroy it quickly!"]

      if (Array.isArray(anim?.msg)) {
        console.warn(`ct anim msg is array? ${anim?.msg}`);
        return;
      }

      if (anim?.msg) {
        //         {
        //   "strFrame": "r2",
        //   "cInf": "m:3",
        //   "fx": "m",
        //   "animStr": "Charge",
        //   "tInf": "m:3",
        //   "msg": "The Grace Crystal prepares a defense shattering attack!"
        // }
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
        break;
      }
    }
  }

  // player
  if (typeof packet?.p === "object") {
    for (const [playerName, data] of Object.entries(packet?.p ?? {})) {
      if (data?.intState === 0 && data?.intHP === 0) {
        bot.emit("playerDeath", playerName);
        AuraStore.playerAuras.delete(playerName);
      }
    }
  }

  // auras
  if (Array.isArray(packet?.a)) {
    for (const aura of packet?.a ?? []) {
      // console.log("aura", aura);
      if (aura?.cmd === "aura+" || aura?.cmd === "aura++") {
        const tgtId = aura?.tInf?.split(":")[1]; // uid / monMapId
        if (!tgtId) continue;

        if (aura?.tInf?.startsWith("m")) {
          // console.log("aura+ cmd on monster:", aura);

          for (const a of aura?.auras ?? []) {
            const data: Aura = {
              name: a.nam,
              duration: a.dur ?? 0,
              isNew: a?.isNew || false,
            };

            if ("val" in a && typeof a.val === "number") data.value = a.val;
            // if (data?.name === "Focus") {
            //   log(`Initial Focus timestamp ${Date.now()}`);
            //   log(
            //     `Monster ${tgtId} gained aura: ${JSON.stringify(data)}, cmd: ${aura?.cmd}, isNew: ${data.isNew}, raw duration: ${a.dur}`,
            //   );
            // }

            if (data.isNew) {
              const monData = bot.world.monsters.find(
                (mon) => String(mon.MonMapID) === tgtId,
              )!;
              bot.emit("auraAdd", new Monster(monData), data);
              AuraStore.addMonsterAura(tgtId, data);
            } else {
              AuraStore.refreshMonsterAura(tgtId, data);
            }
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
              duration: a.dur ?? 0,
              isNew: a?.isNew || false,
            };

            if ("val" in a && typeof a.val === "number") data.value = a.val;

            if (data.isNew) {
              AuraStore.addPlayerAura(username, data);
            } else {
              AuraStore.refreshPlayerAura(username, data);
            }
          }
        }
      } else if (aura?.cmd === "aura-" || aura?.cmd === "aura--") {
        // console.log("aura- cmd");
        const tgtId = aura?.tInf?.split(":")[1]; // uid
        if (!tgtId) continue;

        if (aura?.tInf?.startsWith("m")) {
          // console.log("aura- cmd on monster:", aura);

          if (aura?.aura?.nam) {
            // if (aura?.aura?.nam === "Focus") {
            //   log(
            //     `Monster ${tgtId} lost aura: ${aura?.aura?.nam}, cmd: ${aura?.cmd}, full aura data: ${JSON.stringify(aura)}`,
            //   );
            // }

            const monData = bot.world.monsters.find(
              (mon) => String(mon.MonMapID) === tgtId,
            )!;
            bot.emit("auraRemove", new Monster(monData), aura?.aura?.nam);
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
