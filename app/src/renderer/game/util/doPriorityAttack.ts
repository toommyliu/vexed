import { Bot } from "../lib/Bot";

/**
 * Performs a priority attack on the first available monster in the provided list.
 *
 * @param mons - The monster name or names to attack.
 */
export function doPriorityAttack(mons: string[] | string) {
  const bot = Bot.getInstance();
  const arr = Array.isArray(mons)
    ? mons
    : typeof mons === "string"
      ? mons.split(",")
      : [];

  for (const mon of arr) {
    if (bot.world.isMonsterAvailable(mon)) {
      bot.combat.attack(mon);
      break;
    }
  }
}
