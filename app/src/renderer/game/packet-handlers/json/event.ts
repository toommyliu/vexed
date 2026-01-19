import { AutoZone } from "~/botting/autozone";
import type { Bot } from "~/lib/Bot";
import { registerJsonHandler } from "../registry";

const getRandomIntInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/* eslint-disable id-length */
const AUTO_ZONES: Record<
  string,
  {
    // Range of x and y coordinate for that zone
    zones: Record<"" | "A" | "B", { x: [number, number]; y: [number, number] }>;
  }
> = {
  ledgermayne: {
    zones: {
      A: { x: [147, 276], y: [353, 357] },
      B: { x: [727, 852], y: [353, 356] },
      "": { x: [431, 547], y: [234, 239] },
    },
  },
  moreskulls: {
    zones: {
      A: { x: [696, 802], y: [445, 452] },
      B: { x: [677, 766], y: [321, 324] },
      "": { x: [778, 806], y: [358, 361] },
    },
  },
  ultradage: {
    zones: {
      A: { x: [49, 164], y: [406, 412] },
      B: { x: [797, 900], y: [400, 402] },
      "": { x: [481, 483], y: [296, 300] },
    },
  },
  darkcarnax: {
    zones: {
      A: { x: [731, 850], y: [431, 432] },
      B: { x: [54, 155], y: [431, 432] },
      "": { x: [480, 530], y: [419, 432] },
    },
  },
  astralshrine: {
    zones: {
      A: { x: [643, 708], y: [445, 447] },
      B: { x: [199, 287], y: [181, 205] },
      "": { x: [461, 465], y: [320, 325] },
    },
  },
};
/* eslint-enable id-length */

registerJsonHandler<EventPacket>("event", async (bot: Bot, pkt) => {
  const mapName = bot.world.name;

  if (!bot.player.isReady()) return;

  const zone = pkt.args.zoneSet;
  const config = AUTO_ZONES[mapName];
  if (config && AutoZone.map === mapName) {
    const zonePos = config.zones[zone];
    if (zonePos) {
      const xPos = getRandomIntInRange(zonePos.x[0], zonePos.x[1]);
      const yPos = getRandomIntInRange(zonePos.y[0], zonePos.y[1]);
      bot.player.walkTo(xPos, yPos);
      return;
    }
  }

  if (mapName === "queeniona" && AutoZone.map === "queeniona") {
    await bot.sleep(500);

    try {
      const plyr = bot.world.players?.get(bot.auth.username);
      const positiveCharge =
        (plyr?.getAura("Positive Charge")?.value ?? -1) > 0;
      const positiveChargeReverse =
        (plyr?.getAura("Positive Charge?")?.value ?? -1) > 0;
      const negativeCharge =
        (plyr?.getAura("Negative Charge")?.value ?? -1) > 0;
      const negativeChargeReverse =
        (plyr?.getAura("Negative Charge?")?.value ?? -1) > 0;

      const hasPositiveCharge = positiveCharge || positiveChargeReverse;
      const hasNegativeCharge = negativeCharge || negativeChargeReverse;

      const moveLeft = () => {
        const xPos = getRandomIntInRange(111, 272);
        const yPos = getRandomIntInRange(369, 379);
        bot.player.walkTo(xPos, yPos);
      };

      const moveRight = () => {
        const xPos = getRandomIntInRange(746, 869);
        const yPos = getRandomIntInRange(369, 379);
        bot.player.walkTo(xPos, yPos);
      };

      const moveCenter = () => {
        bot.player.walkTo(490, 320);
      };

      if (zone === "A") {
        if (hasPositiveCharge) {
          moveRight();
        } else if (hasNegativeCharge) {
          moveLeft();
        }
      } else if (zone === "B") {
        if (hasPositiveCharge) {
          moveLeft();
        } else if (hasNegativeCharge) {
          moveRight();
        }
      } else {
        moveCenter();
      }
    } catch {}
  }
});

type EventPacket = {
  args: {
    zoneSet: "" | "A" | "B";
  };
};
