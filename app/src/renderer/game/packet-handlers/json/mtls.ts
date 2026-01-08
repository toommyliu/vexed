import { registerJsonHandler } from "../registry";

registerJsonHandler<MtlsPacket>("mtls", async (bot, packet) => {
    const monMapID = packet.id;
    
});

export type MtlsPacket = {
    id: number; // monMapID
    o: {
        intHP: number;
        intMP: number;
        intState: number;
    }
}