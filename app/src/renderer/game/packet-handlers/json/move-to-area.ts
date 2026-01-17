import { registerJsonHandler } from "../registry";

registerJsonHandler<MoveToAreaPacket>("moveToArea", (bot, packet) => {
  bot.world._moveToArea(packet);
});

export type MoveToAreaPacket = {
  areaId: number;
  areaName: string; // battleon-12345
  monBranch?: {
    MonID: string;
    MonMapID: number;
    bRed: string;
    iLvl: number;
    intHP: number;
    intHPMax: number;
    intMP: number;
    intMPMax: number;
    intState: number;
    wDPS: number;
  }[];
  mondef?: {
    MonID: string;
    intLevel: number;
    sRace: string;
    strBehave: string;
    strLinkage: string;
    strMonFileName: string;
    strMonName: string;
  }[];
  monmap?: {
    MonID: string;
    MonMapID: string;
    bRed: string;
    intRSS: string;
    strFrame: string;
  }[];
  uoBranch?: {
    afk: boolean;
    entID: number;
    entType: string;
    intHP: number;
    intHPMax: number;
    intLevel: number;
    intMP: number;
    intMPMax: number;
    intState: number;
    showCloak: boolean;
    strFrame: string;
    strPad: string;
    strUsername: string;
    tx: number;
    ty: number;
    uoName: string;
  }[];
};
