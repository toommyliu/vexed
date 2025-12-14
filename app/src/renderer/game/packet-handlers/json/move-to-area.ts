import type { Bot } from "../../lib/Bot";
import type { AvatarData } from "../../lib/models/Avatar";

export async function moveToArea(bot: Bot, packet: MoveToAreaPacket) {
  bot.world._moveToArea(packet);

  bot.emit("mapChanged", packet.areaName);
  bot.emit("moveToArea", packet);
}

export type MoveToAreaPacket = {
  areaId: number;
  areaName: string; // buyhouse-12345
  cmd: string; // moveToArea
  intType: string;
  monBranch: {
    MonID: string;
    MonMapID: number;
    bRed: string;
    iLvl: number;
    intHP: number;
    intHPMax: number;
    intMP: number;
    intMPMax: number;
    intState: number;
  }[];
  mondef: {
    MonID: string;
    intLevel: number;
    sRace: string;
    strBehave: string;
    strLinkage: string;
    strMonFileName: string;
    strMonName: string;
  }[];
  monmap: {
    MonID: string;
    MonMapID: string;
    bRed: string;
    intRSS: string;
    strFrame: string;
  }[];
  sExtra: string;
  strMapFileName: string;
  strMapName: string; // buyhouse
  uoBranch: AvatarData[];
};
