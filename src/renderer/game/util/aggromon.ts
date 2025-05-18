import { interval } from "../../../common/interval";
import { Bot } from "../lib/Bot";
import { extractMonsterMapId, isMonsterMapId } from "./isMonMapId";
import { makeAggromonPacket } from "./makeAggromonPacket";

let _stop: (() => void) | null = null;

export function startAggromon(monstersList: string[]) {
  const bot = Bot.getInstance();

  // incase another aggroMon is started before the previous one is stopped
  if (_stop) {
    _stop();
    _stop = null;
  }

  console.log("monsterList parameter:", monstersList);

  // mons contains a list of monster names and monMapIds
  // if the name is present, then we add ALL instances for that monster
  // otherwise we target the provided monMapId
  const monMapIds = monstersList
    .flatMap((mon) => {
      if (isMonsterMapId(mon)) {
        const monMapIdStr = extractMonsterMapId(mon);
        const monster = bot.world.monsters.find(
          (currentMonster) => String(currentMonster?.MonMapID) === monMapIdStr,
        );

        return monster?.MonMapID ?? null;
      } else {
        const monstersWithName = bot.world.monsters.filter(
          (currentMonster) =>
            currentMonster?.strMonName?.toLowerCase() === mon.toLowerCase(),
        );

        return monstersWithName?.length > 0
          ? monstersWithName.map((monster) => monster?.MonMapID)
          : null;
      }
    })
    .filter((id): id is number => id !== null);

  const pkt = makeAggromonPacket(monMapIds, bot.world.roomId);
  if (!pkt) return;

  void interval(async (_, stop) => {
    _stop ??= stop;
    if (!bot.player.isReady()) {
      return;
    }

    bot.packets.sendServer(pkt);
  }, 500);
}

export function stopAggromon() {
  _stop?.();
  _stop = null;
}
