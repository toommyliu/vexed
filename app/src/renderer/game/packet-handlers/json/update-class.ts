import { registerJsonHandler } from "../registry";

registerJsonHandler<UpdateClassPacket>("updateClass", (bot, packet) => {
  bot.player._updateClass(packet.sClassName);
});

type UpdateClassPacket = {
  cmd: "updateClass";
  sClassName: string;
};
