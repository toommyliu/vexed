import { registerJsonHandler } from "../registry";

registerJsonHandler<MtlsPacket>("mtls", async (bot, packet) => {
  const monMapId = packet.id;
  const monster = bot.world.monsters.get(monMapId);
  if (!monster) return;

  const data = packet.o;

  monster.data.intHP = data.intHP;
  monster.data.intMP = data.intMP;
  monster.data.intState = data.intState;
});

export type MtlsPacket = {
  id: number; // monMapID
  o: {
    intHP: number;
    intMP: number;
    intState: number;
  };
};
