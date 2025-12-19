import logger from 'electron-log';
import type { JsonPacketHandler } from "../types";

const log = logger.scope('ccqr');

type CcqrData = {
  QuestID: number;
  bSuccess: number;
  cmd: 'ccqr';
  rewardObj: {
    iCP: number;
    intCoins: number;
    intExp: number;
    intGold: number;
    typ: string;
  };
  sName: string;
};

export default {
  cmd: "ccqr",
  type: "json",
  run: (_bot, data: CcqrData) => {
    if (data.bSuccess === 0) log.debug(`Failed to complete quest: ${data.QuestID}`);
  },
} satisfies JsonPacketHandler<unknown>;
