import type { BaseEntityData } from "./BaseEntityData";

export type MonsterData = BaseEntityData & {
  iLvl: number;
  intMP: number;
  intMPMax: number;
  monId: number;
  monMapId: number;
  sRace: string;
  strFrame: string;
  strMonName: string;
};
