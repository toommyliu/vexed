import { EntityState, type Aura } from "@vexed/game";
import { auras } from "~/lib/stores/aura";
import { registerJsonHandler } from "../registry";

const ADD_AURAS = new Set(["aura+", "aura++"]);
const REMOVE_AURAS = new Set(["aura-", "aura--"]);

registerJsonHandler<CtPacket>("ct", (bot, packet) => {
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
    for (const [playerName, data] of Object.entries(packet.p)) {
      const player = bot.world.players.get(playerName);
      if (!player) continue;

      if (typeof data?.intState === "number")
        player.data.intState = data.intState;
      if (typeof data?.intHP === "number") player.data.intHP = data.intHP;
      if (typeof data?.intMP === "number") player.data.intMP = data.intMP;

      if (
        player.data.intState === EntityState.Dead &&
        player.data.intHP === 0
      ) {
        console.log(`ct :: ${player.data.uoName} died, clearing auras`);
        auras.players.clearTarget(player.data.entID);
      }
    }
  }

  // auras
  if (Array.isArray(packet?.a)) {
    for (const auraObj of packet.a) {
      if (!auraObj?.cmd) continue;

      const parts = auraObj.tInf?.split(":");
      const targetType = parts?.[0] as "m" | "p" | undefined;
      const targetIdStr = parts?.[1];

      if (!targetType || !targetIdStr) continue;

      const auraStore = targetType === "m" ? auras.monsters : auras.players;
      const targetId = Number(targetIdStr);

      if (ADD_AURAS.has(auraObj.cmd)) {
        for (const auraData of auraObj.auras ?? []) {
          const aura: Aura = {
            name: auraData.nam,
            duration: auraData.dur ?? 0,
          };

          if (auraData.val !== undefined) aura.value = auraData.val;
          if (auraData.isNew) {
            auraStore.add(targetId, aura);
          } else {
            auraStore.update(targetId, aura);
          }
        }
      } else if (REMOVE_AURAS.has(auraObj.cmd)) {
        const auraName = auraObj.aura?.nam;
        if (!auraName) continue;

        auraStore.remove(targetId, auraName);

        if (
          targetType === "m" &&
          auraName === "Counter Attack" &&
          bot.settings.counterAttack
        ) {
          bot.combat.attack(`id:${targetIdStr}`);
          bot.combat.pauseAttack = false;
        }
      }
    }
  }

  // update monster data
  if ("m" in packet) {
    for (const [monMapId, data] of Object.entries(packet.m)) {
      const mon = bot.world.monsters.get(Number(monMapId));
      if (!mon) continue;
      if (typeof data?.intHP === "number") mon.data.intHP = data.intHP;
      if (typeof data?.intMP === "number") mon.data.intMP = data.intMP;
      if (typeof data?.intState === "number") mon.data.intState = data.intState;
    }
  }
});

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
      val?: number;
    }[];
    cInf?: string; // p:uid ? the uid of the player that the applied the aura
    cmd?: string; // aura+ or aura-, aura++/aura-- for server messages?
    tInf?: string; // ? the target the aura is applied to
  }[];
  anims?: {
    msg?: string;
  }[];
  m?: {
    // monMapId -> monster condition
    [key: string]: {
      intHP?: number;
      intMP?: number;
      intState?: number;
    };
  };
  p?: {
    // player name
    [key: string]: {
      intHP?: number;
      intMP?: number;
      intState?: number;
    };
  };
};
