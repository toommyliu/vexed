import { registerJsonHandler } from "../registry";

registerJsonHandler<InitUserDatasPacket>("initUserDatas", (bot, packet) => {
  for (const user of packet.a)
    bot.world.players.register(user.data.strUsername, user.uid);
});

type InitUserDatasPacket = {
  a: {
    data: {
      strUsername: string;
    };
    uid: number;
  }[];
  cmd: "initUserDatas";
};
