import { tipc } from "@vexed/tipc";
import type {
  AppLogEntry,
  GrabberDataType,
  LoaderDataType,
  FastTravel,
  FastTravelRoomNumber,
  EnvironmentState,
  EnvironmentUpdatePayload,
} from "../shared/types";
import { createAppLogsTipcRouter } from "./tipc/appLogs";
import { createArmyTipcRouter } from "./tipc/army";
import { createEnvironmentTipcRouter } from "./tipc/environment";
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
  appLogs: createAppLogsTipcRouter(tipcInstance),
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
  environment: createEnvironmentTipcRouter(tipcInstance),
};

export type TipcRouter = typeof router;

/* eslint-disable typescript-sort-keys/interface */

export type RendererHandlers = {
  appLogs: {
    append(input: AppLogEntry): void;
    init(input: { entries: AppLogEntry[] }): void;
    reset(): void;
  };

  environment: {
    getState(): Promise<EnvironmentState>;
    updateState(input: EnvironmentUpdatePayload): void;
    stateChanged(input: EnvironmentState): void;
    grabBoosts(): Promise<string[]>;
    grabBoostsResponse(input: { boosts: string[] }): void;
  };

  game: {
    getAssetPath(): Promise<string>;
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
    getAll(): Promise<FastTravel[]>;
  };

  loaderGrabber: {
    load(input: { type: LoaderDataType; id: number }): void;
    grab(input: { type: GrabberDataType }): Promise<unknown>;
  };

  follower: {
    me(): Promise<string>;
    start(input: {
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
    stop(): Promise<void>;
  };

  hotkeys: {
    updateHotkey(input: { id: string; value: string }): Promise<void>;
  };

  packetLogger: {
    start(): void;
    stop(): void;
    packet(input: { packet: string; type: string }): void;
  };

  packetSpammer: {
    start(input: { delay: number; packets: string[] }): void;
    stop(): void;
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
    getAccounts(): Promise<Account[]>;
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
