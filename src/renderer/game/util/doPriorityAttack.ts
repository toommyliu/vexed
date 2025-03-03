import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();

export function doPriorityAttack(mons: string[] | string) {
  const arr = Array.isArray(mons) ? mons : mons.split(',');
  for (const mon of arr) {
    if (bot.world.isMonsterAvailable(mon)) {
      bot.combat.attack(mon);
      break;
    }
  }
}
