import { equalsIgnoreCase } from "@vexed/utils";
// import { parseMapStr } from "~/lib/util/parse-m";
import { registerJsonHandler } from "../registry";

registerJsonHandler<MoveToAreaPacket>("moveToArea", (bot, packet) => {
  bot.world.players.clear();
  bot.world.monsters.clear();

  // save map data
  // const [roomName, roomNumber] = parseMapStr(packet.areaName);
  // this.#roomName = roomName;
  // this.#roomNumber = Number(roomNumber);
  // this.#roomId = packet.areaId;

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
      intHP: mon.intHP,
      intHPMax: mon.intHPMax,
      intMP: mon.intMP,
      intMPMax: mon.intMPMax,
      intState: mon.intState,
      sRace: def?.sRace ?? "Unknown",
      strMonName: def?.strMonName ?? "Unknown",
      strFrame: mapInfo?.strFrame ?? "",
    };
    bot.world.monsters.add(obj);
  }

  // save player data
  for (const plyr of packet.uoBranch ?? []) {
    const obj = {
      intHP: plyr.intHP,
      intHPMax: plyr.intHPMax,
      intMP: plyr.intMP,
      intMPMax: plyr.intMPMax,
      intState: plyr.intState,
      strFrame: plyr.strFrame,
      strUsername: plyr.strUsername,
      tx: plyr.tx,
      ty: plyr.ty,
      uoName: plyr.uoName,
      entID: plyr.entID,
      entType: plyr.entType,
      intLevel: plyr.intLevel,
      strPad: plyr.strPad,
      afk: plyr.afk,
    };
    bot.world.players.add(obj);

    if (equalsIgnoreCase(plyr.strUsername, bot.auth.username))
      bot.world.players.setMe(plyr.strUsername);
  }
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
