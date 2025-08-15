import { tipc } from "@vexed/tipc";
import type {
  GrabberDataType,
  LoaderDataType,
  FastTravel,
  FastTravelRoomNumber,
} from "../shared/types";
import { createArmyTipcRouter } from "./tipc/army";
import { createFastTravelsTipcRouter } from "./tipc/fastTravels";
import { createFollowerTipcRouter } from "./tipc/follower";
import { createGameTipcRouter } from "./tipc/game";
import { createHotkeysTipcRouter } from "./tipc/hotkeys";
import { createLoaderGrabberTipcRouter } from "./tipc/loaderGrabber";
import { createManagerTipcRouter } from "./tipc/manager";
import { createPacketLoggerTipcRouter } from "./tipc/packetLogger";
import { createPacketSpammerTipcRouter } from "./tipc/packetSpammer";
import { createScriptsTipcRouter } from "./tipc/scripts";

const tipcInstance = tipc.create();

export const router = {
  game: createGameTipcRouter(tipcInstance),
  scripts: createScriptsTipcRouter(tipcInstance),
  fastTravels: createFastTravelsTipcRouter(tipcInstance),
  loaderGrabber: createLoaderGrabberTipcRouter(tipcInstance),
  follower: createFollowerTipcRouter(tipcInstance),
  packetLogger: createPacketLoggerTipcRouter(tipcInstance),
  packetSpammer: createPacketSpammerTipcRouter(tipcInstance),
  hotkeys: createHotkeysTipcRouter(tipcInstance),
  manager: createManagerTipcRouter(tipcInstance),
  army: createArmyTipcRouter(tipcInstance),
};

export type TipcRouter = typeof router;

/* eslint-disable typescript-sort-keys/interface */

export type RendererHandlers = {
  game: {
    gameReloaded(): void;
  };

  scripts: {
    scriptLoaded(fromManager: boolean): void;
    toggleDevTools(): void;
    gameReload(): void;
  };

  fastTravels: {
    fastTravelEnable(): void;
    doFastTravel({ location }: { location: FastTravelRoomNumber }): void;
    getFastTravels(): Promise<FastTravel[]>;
  };

  loaderGrabber: {
    load(input: { type: LoaderDataType; id: number }): void;
    grab(input: { type: GrabberDataType }): Promise<unknown>;
  };

  follower: {
    followerMe(): Promise<string>;
    followerStart(input: {
      antiCounter: boolean;
      attackPriority: string;
      copyWalk: boolean;
      drops: string;
      name: string;
      quests: string;
      rejectElse: boolean;
      safeSkill: string;
      safeSkillEnabled: boolean;
      safeSkillHp: string;
      skillDelay: string;
      skillList: string;
      skillWait: boolean;
    }): Promise<void>;
    followerStop(): Promise<void>;
  };

  hotkeys: {
    updateHotkey(input: { id: string; value: string }): Promise<void>;
  };

  packetLogger: {
    packetLoggerStart(): void;
    packetLoggerStop(): void;
    packetLoggerPacket(input: { packet: string; type: string }): void;
  };

  packetSpammer: {
    packetSpammerStart(input: { delay: number; packets: string[] }): void;
    packetSpammerStop(): void;
  };

  army: {
    init(input: {
      fileName: string;
      playerName: string;
      players: string[];
    }): Promise<void>;
    join(input: { fileName: string; playerName: string }): Promise<void>;
    finishJob(): Promise<void>;
    armyReady(): Promise<void>;
  };

  manager: {
    managerLoginSuccess(username: string): void;
    enableButton(username: string): Promise<void>;
    getAccounts(): Promise<unknown[]>;
    addAccount(account: Account): Promise<boolean>;
    removeAccount(payload: { username: string }): Promise<boolean>;
    updateAccount(payload: {
      originalUsername: string;
      updatedAccount: Account;
    }): Promise<boolean>;
    mgrLoadScript(): Promise<string>;
    launchGame(input: AccountWithServer): Promise<void>;
  };
};
/* eslint-enable typescript-sort-keys/interface */
