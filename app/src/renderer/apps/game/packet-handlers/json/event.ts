import type { Collection } from "@vexed/collection";
import { AutoZone } from "~/botting/autozone";
import type { Bot } from "~/lib/Bot";
import { auras, type StoredAura } from "~/lib/stores/aura";
import { registerJsonHandler } from "../registry";

type ZoneSet = "" | "A" | "B";

type Coordinates = [number, number];

type ZoneConfig = {
  zones: Record<ZoneSet, { x: Coordinates; y: Coordinates }>;
};

type EventPacket = {
  args: {
    zoneSet: ZoneSet;
  };
};

/* eslint-disable id-length */
const AUTO_ZONES: Record<string, ZoneConfig> = {
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

const getRandomIntInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomCoordinate = (range: Coordinates): number =>
  getRandomIntInRange(range[0], range[1]);

const walkToRandomPosition = (
  bot: Bot,
  xRange: Coordinates,
  yRange: Coordinates,
): void => {
  const xPos = getRandomCoordinate(xRange);
  const yPos = getRandomCoordinate(yRange);
  bot.player.walkTo(xPos, yPos);
};

const hasAura = (
  aurasStore: Collection<string, StoredAura> | undefined,
  auraName: string,
): boolean => (aurasStore?.get(auraName)?.value ?? 0) > 0;

const handleAutoZone = (bot: Bot, mapName: string, zone: ZoneSet): boolean => {
  const config: ZoneConfig | undefined = AUTO_ZONES[mapName];
  if (!config || AutoZone.map !== mapName) return false;

  const zonePos = config.zones[zone];
  if (!zonePos) return false;

  walkToRandomPosition(bot, zonePos.x, zonePos.y);
  return true;
};

const handleQueenionaZone = async (bot: Bot, zone: ZoneSet): Promise<void> => {
  await bot.sleep(500);

  const me = bot.world.players.me;
  if (!me) return;

  const myAuras = auras.players.get(me.data.entID);
  const positiveCharge =
    hasAura(myAuras, "Positive Charge") || hasAura(myAuras, "Positive Charge?");
  const negativeCharge =
    hasAura(myAuras, "Negative Charge") || hasAura(myAuras, "Negative Charge?");

  const moveLeft = () => walkToRandomPosition(bot, [111, 272], [369, 379]);
  const moveRight = () => walkToRandomPosition(bot, [746, 869], [369, 379]);
  const moveCenter = () => bot.player.walkTo(490, 320);

  if (zone === "A") {
    if (positiveCharge) moveRight();
    else if (negativeCharge) moveLeft();
  } else if (zone === "B") {
    if (positiveCharge) moveLeft();
    else if (negativeCharge) moveRight();
  } else {
    moveCenter();
  }
};

registerJsonHandler<EventPacket>("event", async (bot: Bot, pkt) => {
  if (!bot.player.isReady()) return;

  const mapName = bot.world.name;
  const zone = pkt.args.zoneSet;

  if (mapName === "queeniona" && AutoZone.map === "queeniona") {
    await handleQueenionaZone(bot, zone);
    return;
  }

  handleAutoZone(bot, mapName, zone);
});
