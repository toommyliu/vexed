import type { ServerData } from "@vexed/game";

export type LoginInfo = {
  servers: ServerData[];
  bSuccess: number;
  iUpg: number;
  unm: string; // username
  sToken: string; // password
}