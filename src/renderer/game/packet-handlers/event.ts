import type { Bot } from "../lib/Bot";
import { getRandomInt } from "../util/get-random-int";

export async function event(bot: Bot, pkt: EventPacket) {
  console.log(`zoneSet: ${pkt.args.zoneSet ?? "none"}`);
  const mapName = bot.world.name;

  if (!bot.player.isReady()) return;

  if (mapName === "ledgermayne") {
    let xPos: number;
    let yPos: number;

    switch (pkt.args.zoneSet) {
      case "A":
        xPos = getRandomInt(147, 276);
        yPos = getRandomInt(353, 357);
        break;
      case "B":
        xPos = getRandomInt(727, 852);
        yPos = getRandomInt(353, 356);
        break;
      case "":
        xPos = getRandomInt(431, 547);
        yPos = getRandomInt(234, 239);
        break;
    }

    bot.player.walkTo(xPos, yPos);
  } else if (mapName === "moreskulls") {
    let xPos: number;
    let yPos: number;

    switch (pkt.args.zoneSet) {
      case "A": // Move down
        xPos = getRandomInt(696, 802);
        yPos = getRandomInt(445, 452);
        break;
      case "B": // Move up
        xPos = getRandomInt(677, 766);
        yPos = getRandomInt(321, 324);
        break;
      case "":
        xPos = getRandomInt(778, 806);
        yPos = getRandomInt(358, 361);
        break;
    }

    bot.player.walkTo(xPos, yPos);
  } else if (mapName === "ultradage") {
    let xPos: number;
    let yPos: number;

    switch (pkt.args.zoneSet) {
      case "A":
        xPos = getRandomInt(49, 164);
        yPos = getRandomInt(406, 412);
        break;
      case "B":
        xPos = getRandomInt(797, 900);
        yPos = getRandomInt(400, 402);
        break;
      case "":
        xPos = getRandomInt(481, 483);
        yPos = getRandomInt(296, 300);
        break;
    }

    bot.player.walkTo(xPos, yPos);
  } else if (mapName === "darkcarnax") {
    let xPos: number;
    let yPos: number;

    switch (pkt.args.zoneSet) {
      case "A": // Move to right
        xPos = getRandomInt(731, 850);
        yPos = getRandomInt(431, 432);
        break;
      case "B": // Move to left
        xPos = getRandomInt(54, 155);
        yPos = getRandomInt(431, 432);
        break;
      case "":
        xPos = getRandomInt(480, 530);
        yPos = getRandomInt(419, 432);
        break;
    }

    bot.player.walkTo(xPos, yPos);
  }
}

type EventPacket = {
  args: {
    zoneSet: "" | "A" | "B";
  };
};
