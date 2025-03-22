import { interval } from '../../common/interval';
import { Bot } from './lib/Bot';

let on = false;
let prevMap: string | null = null;

const bot = Bot.getInstance();
const monstersByCell = new Map<string, Set<number>>();

function groupMonstersByCell() {
  if (prevMap === bot.world.name) {
    return;
  }

  monstersByCell.clear();

  for (const mon of bot.world.monsters) {
    const cell = mon.strFrame;
    if (!monstersByCell.has(cell)) {
      monstersByCell.set(cell, new Set());
    }

    monstersByCell.get(cell)?.add(mon.MonMapID);
  }

  prevMap = bot.world.name;
}

export function startAutoAggro() {
  on = true;

  if (!bot.player.isReady() || !bot.world.monsters.length) return;

  groupMonstersByCell();

  void interval(async (_, stop) => {
    if (!bot.player.isReady()) return;

    if (!on) {
      stop();
      return;
    }

    groupMonstersByCell();

    const monMapIdSet = new Set<number>();
    for (const [cell, monsters] of monstersByCell) {
      for (const plyr of bot.world.playerNames) {
        try {
          const playerCell = bot.world.players?.get(plyr.toLowerCase())?.cell;
          if (playerCell === cell) {
            for (const id of monsters) monMapIdSet.add(id);
            break;
          }
        } catch {}
      }
    }

    if (!monMapIdSet.size) return;

    const packet = `%xt%zm%aggroMon%${bot.world.roomId}%${Array.from(monMapIdSet).join('%')}%`;
    bot.packets.sendServer(packet);
  }, 500);
}

export function stopAutoAggro() {
  on = false;
}
