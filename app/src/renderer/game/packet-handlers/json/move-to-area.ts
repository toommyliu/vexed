import { registerJsonHandler } from "../registry";

registerJsonHandler<MoveToAreaPacket>("moveToArea", (bot, packet) => {
  bot.world.players.clear();
  bot.world.monsters.clear();

  // save monster data
  const monDefMap = new Map(
    packet.mondef?.map((def) => [def.MonID, def]) ?? [],
  );
  const monMapMap = new Map(
    packet.monmap?.map((monMapInfo) => [monMapInfo.MonMapID, monMapInfo]) ?? [],
  );
  for (const mon of packet.monBranch ?? []) {
    const def = monDefMap.get(mon.MonID);
    const mapInfo = monMapMap.get(String(mon.MonMapID));

    const obj = {
      monId: Number(mon.MonID),
      monMapId: mon.MonMapID,
      iLvl: mon.iLvl,
      intHp: mon.intHP,
      intHpMax: mon.intHPMax,
      intMp: mon.intMP,
      intMpMax: mon.intMPMax,
      intState: mon.intState,
      sRace: def?.sRace ?? "Unknown",
      strMonName: def?.strMonName ?? "Unknown",
      strFrame: mapInfo?.strFrame ?? "",
    };
    bot.world.monsters.add(obj);
  }

  // save player data
});

export type MoveToAreaPacket = {
  areaName: string;
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
    showHelm: boolean;
    strPad: string;
    strUsername: string;
    tx: number;
    ty: number;
    uoName: string;
  }[];
};
