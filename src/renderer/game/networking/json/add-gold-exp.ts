import type { Bot } from '../../lib/Bot';

function isAddGoldExpMonster(
  packet: AddGoldExpPacket,
): packet is AddGoldExpPacket & { b: { o: AddGoldExpMonsterPacket } } {
  return packet.b.o.typ === 'm';
}

export async function addGoldExp(bot: Bot, packet: AddGoldExpPacket) {
  if (isAddGoldExpMonster(packet)) {
    const getMonster = () =>
      bot.world.availableMonsters.find((mon) => mon.monMapId === packet.b.o.id);
    bot.emit('monsterDeath', getMonster());
    await bot.waitUntil(() => Boolean(getMonster()?.alive));
    bot.emit('monsterRespawn', getMonster());
  }
}

type AddGoldExpMonsterPacket = {
  bonusGold: number;
  cmd: 'addGoldExp';
  id: number;
  intExp: number;
  intGold: number;
  typ: 'm';
};

type AddGoldExpQuestPacket = {
  cmd: 'addGoldExp';
  intExp: number;
  intGold: number;
  typ: 'q';
};

export type AddGoldExpPacket = {
  b: {
    o: AddGoldExpMonsterPacket | AddGoldExpQuestPacket;
    /**
     * Always -1?
     */
    r: number;
  };
  t: 'xt';
};
