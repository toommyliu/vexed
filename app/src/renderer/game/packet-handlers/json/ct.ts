import { registerJsonHandler } from "../registry";

// const ADD_AURAS = new Set(["aura+", "aura++"]);
// const REMOVE_AURAS = new Set(["aura-", "aura--"]);

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

      // TODO: auras
    }
  }

  // TODO: auras
  // if (Array.isArray(packet?.a)) {
  //   for (const aura of packet?.a ?? []) {
  //     if (!aura?.cmd) continue;

  //     const parts = aura?.tInf?.split(":");
  //     const type = parts?.[0] as "m" | "p" | undefined;
  //     const tgtId = parts?.[1] as string | undefined;

  //     if (!type || !tgtId) continue;

  //     if (ADD_AURAS.has(aura.cmd)) {
  //       if (type === "m") {
  //         for (const aura_ of aura?.auras ?? []) {
  //           const data: Aura = {
  //             name: aura_.nam,
  //             duration: aura_.dur ?? 0,
  //             isNew: aura_?.isNew || false,
  //           };

  //           if ("val" in aura_ && typeof aura_.val === "number") {
  //             data.value = aura_.val;
  //           }

  //           if (data.isNew) AuraStore.addMonsterAura(tgtId, data);
  //           else AuraStore.refreshMonsterAura(tgtId, data);
  //         }
  //       } else if (type === "p") {
  //         const entId = Number(tgtId);

  //         for (const aura_ of aura?.auras ?? []) {
  //           const data: Aura = {
  //             name: aura_.nam,
  //             duration: aura_.dur ?? 0,
  //             isNew: aura_?.isNew || false,
  //           };

  //           if ("val" in aura_ && typeof aura_.val === "number") {
  //             data.value = aura_.val;
  //           }

  //           if (data.isNew) AuraStore.addPlayerAura(entId, data);
  //           else AuraStore.refreshPlayerAura(entId, data);
  //         }
  //       }
  //     } else if (REMOVE_AURAS.has(aura.cmd)) {
  //       const auraName = aura?.aura?.nam;
  //       if (!auraName) continue;

  //       if (type === "m") {
  //         AuraStore.removeMonsterAura(tgtId, auraName);

  //         if (auraName === "Counter Attack" && bot.settings.counterAttack) {
  //           bot.combat.attack(`id:${tgtId}`);
  //           bot.combat.pauseAttack = false;
  //         }
  //       } else if (type === "p") {
  //         AuraStore.removePlayerAura(Number(tgtId), auraName);
  //       }
  //     }
  //   }
  // }

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
