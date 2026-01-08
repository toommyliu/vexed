import { AuraStore } from "~/lib/util/AuraStore";
import { registerJsonHandler } from "../registry";

registerJsonHandler<MoveToAreaPacket>("moveToArea", (bot, packet) => {
  AuraStore.clear();
  bot.world.monsters.clear();

  const monDefMap = new Map(packet.mondef?.map((def) => [def.MonID, def]) ?? []);
  const monMapMap = new Map(packet.monmap?.map((monMapInfo) => [monMapInfo.MonMapID, monMapInfo]) ?? []);
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
    console.table(obj);
    bot.world.monsters.add(obj);
  }

  for (const user of packet.uoBranch ?? []) {
    if (user.strUsername.toLowerCase() === bot.auth.username.toLowerCase()) continue;
    AuraStore.registerPlayer(user.strUsername, user.entID);
  }
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
    strFrame: string;
    strPad: string;
    strUsername: string;
    tx: number;
    ty: number;
    uoName: string;
  }[];
};

// {
//   "monBranch": [
//     {
//       "intHP": 1640,
//       "iLvl": 25,
//       "MonMapID": 1,
//       "intHPMax": 1640,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "219",
//       "intState": 1,
//       "wDPS": 43,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 1640,
//       "iLvl": 25,
//       "MonMapID": 2,
//       "intHPMax": 1640,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "219",
//       "intState": 1,
//       "wDPS": 43,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 1640,
//       "iLvl": 25,
//       "MonMapID": 3,
//       "intHPMax": 1640,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "219",
//       "intState": 1,
//       "wDPS": 43,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 1640,
//       "iLvl": 25,
//       "MonMapID": 4,
//       "intHPMax": 1640,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "219",
//       "intState": 1,
//       "wDPS": 43,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 1640,
//       "iLvl": 25,
//       "MonMapID": 5,
//       "intHPMax": 1640,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "219",
//       "intState": 1,
//       "wDPS": 43,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 3690,
//       "iLvl": 35,
//       "MonMapID": 6,
//       "intHPMax": 3690,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "92",
//       "intState": 1,
//       "wDPS": 104,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 4170,
//       "iLvl": 13,
//       "MonMapID": 7,
//       "intHPMax": 4170,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "108",
//       "intState": 1,
//       "wDPS": 41,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 4320,
//       "iLvl": 50,
//       "MonMapID": 8,
//       "intHPMax": 4320,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "5681",
//       "intState": 1,
//       "wDPS": 99,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 78560,
//       "iLvl": 100,
//       "MonMapID": 9,
//       "intHPMax": 78560,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "35",
//       "intState": 1,
//       "wDPS": 1428571428,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 200000,
//       "iLvl": 75,
//       "MonMapID": 10,
//       "intHPMax": 200000,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "110",
//       "intState": 1,
//       "wDPS": 612,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 1640,
//       "iLvl": 25,
//       "MonMapID": 11,
//       "intHPMax": 1640,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "219",
//       "intState": 1,
//       "wDPS": 43,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 4320,
//       "iLvl": 50,
//       "MonMapID": 12,
//       "intHPMax": 4320,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "5681",
//       "intState": 1,
//       "wDPS": 99,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 4320,
//       "iLvl": 50,
//       "MonMapID": 13,
//       "intHPMax": 4320,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "5681",
//       "intState": 1,
//       "wDPS": 99,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 3690,
//       "iLvl": 35,
//       "MonMapID": 14,
//       "intHPMax": 3690,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "33",
//       "intState": 1,
//       "wDPS": 42,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 1640,
//       "iLvl": 25,
//       "MonMapID": 15,
//       "intHPMax": 1640,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "219",
//       "intState": 1,
//       "wDPS": 43,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 3320,
//       "iLvl": 15,
//       "MonMapID": 16,
//       "intHPMax": 3320,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "3665",
//       "intState": 1,
//       "wDPS": 32,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 3320,
//       "iLvl": 15,
//       "MonMapID": 17,
//       "intHPMax": 3320,
//       "bRed": "0",
//       "intMP": 100,
//       "MonID": "3666",
//       "intState": 1,
//       "wDPS": 32,
//       "intMPMax": 100
//     },
//     {
//       "intHP": 1000000000,
//       "iLvl": 255,
//       "MonMapID": 18,
//       "intHPMax": 1000000000,
//       "bRed": "1",
//       "intMP": 100,
//       "MonID": "5682",
//       "intState": 1,
//       "wDPS": 3571,
//       "intMPMax": 100
//     }
//   ],
//   "areaName": "tercessuinotlim-1",
//   "mondef": [
//     {
//       "intLevel": 35,
//       "strMonFileName": "Ninja2.swf",
//       "strMonName": "Ninja Spy",
//       "strBehave": "walk",
//       "MonID": "33",
//       "sRace": "None",
//       "strLinkage": "Ninja2"
//     },
//     {
//       "intLevel": 100,
//       "strMonFileName": "Nulgath.swf",
//       "strMonName": "Nulgath",
//       "strBehave": "walk",
//       "MonID": "35",
//       "sRace": "None",
//       "strLinkage": "Nulgath"
//     },
//     {
//       "intLevel": 35,
//       "strMonFileName": "Darkelemental.swf",
//       "strMonName": "Tainted Elemental",
//       "strBehave": "walk",
//       "MonID": "92",
//       "sRace": "Elemental",
//       "strLinkage": "Darkelemental"
//     },
//     {
//       "intLevel": 13,
//       "strMonFileName": "Darkelemental.swf",
//       "strMonName": "Evil Elemental",
//       "strBehave": "walk",
//       "MonID": "108",
//       "sRace": "Elemental",
//       "strLinkage": "Darkelemental"
//     },
//     {
//       "intLevel": 75,
//       "strMonFileName": "OrcBoss3.swf",
//       "strMonName": "Taro Blademaster",
//       "strBehave": "walk",
//       "MonID": "110",
//       "sRace": "None",
//       "strLinkage": "OrcBoss3"
//     },
//     {
//       "intLevel": 25,
//       "strMonFileName": "Imp02.swf",
//       "strMonName": "Dark Makai",
//       "strBehave": "walk",
//       "MonID": "219",
//       "sRace": "None",
//       "strLinkage": "Imp02"
//     },
//     {
//       "intLevel": 15,
//       "strMonFileName": "monster-VoidKnight.swf",
//       "strMonName": "Void Knight",
//       "strBehave": "walk",
//       "MonID": "3665",
//       "sRace": "Elemental",
//       "strLinkage": "VoidKnight"
//     },
//     {
//       "intLevel": 15,
//       "strMonFileName": "monster-VoidMonk.swf",
//       "strMonName": "Void Monk",
//       "strBehave": "walk",
//       "MonID": "3666",
//       "sRace": "Elemental",
//       "strLinkage": "VoidMonk"
//     },
//     {
//       "intLevel": 50,
//       "strMonFileName": "MiltoniusBoss2r1.swf",
//       "strMonName": "Shadow of Nulgath",
//       "strBehave": "walk",
//       "MonID": "5681",
//       "sRace": "None",
//       "strLinkage": "MiltoniusBoss2"
//     },
//     {
//       "intLevel": 255,
//       "strMonFileName": "Invisible.swf",
//       "strMonName": "???",
//       "strBehave": "walk",
//       "MonID": "5682",
//       "sRace": "None",
//       "strLinkage": "Invisible"
//     }
//   ],
//   "uoBranch": [
//     {
//       "entID": 63793,
//       "intHP": 3180,
//       "intLevel": 100,
//       "entType": "p",
//       "intHPMax": 3180,
//       "showHelm": true,
//       "tx": 0,
//       "ty": 0,
//       "strUsername": "renier12345",
//       "showCloak": false,
//       "afk": false,
//       "uoName": "renier12345",
//       "strPad": "Left",
//       "intMP": 100,
//       "intState": 1,
//       "intMPMax": 100,
//       "strFrame": "Taro"
//     },
//     {
//       "entID": 66388,
//       "intHP": 2950,
//       "intLevel": 91,
//       "entType": "p",
//       "intHPMax": 2950,
//       "showHelm": true,
//       "tx": 0,
//       "ty": 0,
//       "strUsername": "stefan gladiatorul",
//       "showCloak": true,
//       "afk": false,
//       "uoName": "stefan gladiatorul",
//       "strPad": "Left",
//       "intMP": 100,
//       "intState": 1,
//       "intMPMax": 100,
//       "strFrame": "Swindle"
//     },
//     {
//       "entID": 66451,
//       "intHP": 2835,
//       "intLevel": 100,
//       "entType": "p",
//       "intHPMax": 2835,
//       "showHelm": false,
//       "tx": 0,
//       "ty": 0,
//       "strUsername": "drblindfalcon",
//       "showCloak": false,
//       "afk": false,
//       "uoName": "drblindfalcon",
//       "strPad": "Left",
//       "intMP": 100,
//       "intState": 1,
//       "intMPMax": 100,
//       "strFrame": "m5"
//     },
//     {
//       "entID": 66500,
//       "intHP": 1199,
//       "intLevel": 22,
//       "entType": "p",
//       "intHPMax": 1199,
//       "showHelm": true,
//       "tx": 0,
//       "ty": 0,
//       "strUsername": "suspicious69",
//       "showCloak": true,
//       "afk": false,
//       "uoName": "suspicious69",
//       "strPad": "Spawn",
//       "intMP": 100,
//       "intState": 1,
//       "intMPMax": 100,
//       "strFrame": "Enter"
//     }
//   ],
//   "sExtra": "",
//   "intType": "1",
//   "cmd": "moveToArea",
//   "strMapName": "tercessuinotlim",
//   "strMapFileName": "Citadel/town-Tercessuinotlim-10Jan25.swf",
//   "areaId": 407389,
//   "monmap": [
//     {
//       "bRed": "0",
//       "MonID": "219",
//       "intRSS": "-1",
//       "MonMapID": "1",
//       "strFrame": "Enter"
//     },
//     {
//       "bRed": "0",
//       "MonID": "219",
//       "intRSS": "-1",
//       "MonMapID": "2",
//       "strFrame": "m1"
//     },
//     {
//       "bRed": "0",
//       "MonID": "219",
//       "intRSS": "-1",
//       "MonMapID": "3",
//       "strFrame": "m1"
//     },
//     {
//       "bRed": "0",
//       "MonID": "219",
//       "intRSS": "-1",
//       "MonMapID": "4",
//       "strFrame": "m2"
//     },
//     {
//       "bRed": "0",
//       "MonID": "219",
//       "intRSS": "-1",
//       "MonMapID": "5",
//       "strFrame": "m2"
//     },
//     {
//       "bRed": "0",
//       "MonID": "92",
//       "intRSS": "-1",
//       "MonMapID": "6",
//       "strFrame": "m3"
//     },
//     {
//       "bRed": "0",
//       "MonID": "108",
//       "intRSS": "-1",
//       "MonMapID": "7",
//       "strFrame": "m3"
//     },
//     {
//       "bRed": "0",
//       "MonID": "5681",
//       "intRSS": "-1",
//       "MonMapID": "8",
//       "strFrame": "m4"
//     },
//     {
//       "bRed": "0",
//       "MonID": "35",
//       "intRSS": "-1",
//       "MonMapID": "9",
//       "strFrame": "Boss2"
//     },
//     {
//       "bRed": "0",
//       "MonID": "110",
//       "intRSS": "-1",
//       "MonMapID": "10",
//       "strFrame": "Taro"
//     },
//     {
//       "bRed": "0",
//       "MonID": "219",
//       "intRSS": "-1",
//       "MonMapID": "11",
//       "strFrame": "Enter"
//     },
//     {
//       "bRed": "0",
//       "MonID": "5681",
//       "intRSS": "-1",
//       "MonMapID": "12",
//       "strFrame": "Boss2"
//     },
//     {
//       "bRed": "0",
//       "MonID": "5681",
//       "intRSS": "-1",
//       "MonMapID": "13",
//       "strFrame": "Boss2"
//     },
//     {
//       "bRed": "0",
//       "MonID": "33",
//       "intRSS": "-1",
//       "MonMapID": "14",
//       "strFrame": "m4"
//     },
//     {
//       "bRed": "0",
//       "MonID": "219",
//       "intRSS": "-1",
//       "MonMapID": "15",
//       "strFrame": "m12"
//     },
//     {
//       "bRed": "0",
//       "MonID": "3665",
//       "intRSS": "-1",
//       "MonMapID": "16",
//       "strFrame": "m12"
//     },
//     {
//       "bRed": "0",
//       "MonID": "3666",
//       "intRSS": "-1",
//       "MonMapID": "17",
//       "strFrame": "m12"
//     },
//     {
//       "bRed": "1",
//       "MonID": "5682",
//       "intRSS": "-1",
//       "MonMapID": "18",
//       "strFrame": "m10B"
//     }
//   ]
// }