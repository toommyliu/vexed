import { registerJsonHandler } from "../registry";

registerJsonHandler<MtlsPacket>("mtls", async (bot, packet) => {
    const monMapId = packet.id;
    const data = packet.o;

    const mon = bot.world.monsters.get(monMapId);
    if (!mon) return;

    mon.data.intHp = data.intHP;
    mon.data.intMp = data.intMP;
    mon.data.intState = data.intState;
});

export type MtlsPacket = {
    id: number; // monMapID
    o: {
        intHP: number;
        intMP: number;
        intState: number;
    }
}