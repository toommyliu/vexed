import { registerJsonHandler } from "../registry";

registerJsonHandler<InitUserDataPacket>("initUserData", (bot, packet) => {
  bot.world.players.register(packet.data.strUsername, packet.uid);
});

type InitUserDataPacket = {
  cmd: "initUserData";
  data: {
    strUsername: string;
  };
  uid: number;
};
