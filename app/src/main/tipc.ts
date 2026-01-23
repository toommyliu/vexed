import { tipc } from "@vexed/tipc";
import type {
  GrabberDataType,
  LoaderDataType,
  FastTravel,
  FastTravelRoomNumber,
  EnvironmentState,
  EnvironmentUpdatePayload,
} from "../shared/types";
import { createArmyTipcRouter } from "./tipc/army.router";
import { createEnvironmentTipcRouter } from "./tipc/environment.router";
import { createFastTravelsTipcRouter } from "./tipc/fastTravels.router";
import { createFollowerTipcRouter } from "./tipc/follower.router";
import { createGameTipcRouter } from "./tipc/game.router";
import { createHotkeysTipcRouter } from "./tipc/hotkeys.router";
import { createLoaderGrabberTipcRouter } from "./tipc/loaderGrabber.router";
import { createLoggerTipcRouter } from "./tipc/logger.router";
import { createManagerTipcRouter } from "./tipc/manager.router";
import { createOnboardingTipcRouter } from "./tipc/onboarding.router";
import { createPacketLoggerTipcRouter } from "./tipc/packetLogger.router";
import { createPacketSpammerTipcRouter } from "./tipc/packetSpammer.router";
import { createScriptsTipcRouter } from "./tipc/scripts.router";

const tipcInstance = tipc.create();

export const router = {
  game: createGameTipcRouter(tipcInstance),
  scripts: createScriptsTipcRouter(tipcInstance),
  fastTravels: createFastTravelsTipcRouter(tipcInstance),
  loaderGrabber: createLoaderGrabberTipcRouter(tipcInstance),
  follower: createFollowerTipcRouter(tipcInstance),
  packetLogger: createPacketLoggerTipcRouter(tipcInstance),
  packetSpammer: createPacketSpammerTipcRouter(tipcInstance),
  logger: createLoggerTipcRouter(tipcInstance),
  hotkeys: createHotkeysTipcRouter(tipcInstance),
  manager: createManagerTipcRouter(tipcInstance),
  army: createArmyTipcRouter(tipcInstance),
  environment: createEnvironmentTipcRouter(tipcInstance),
  onboarding: createOnboardingTipcRouter(tipcInstance),
};

export type TipcRouter = typeof router;

/* eslint-disable typescript-sort-keys/interface */

export type RendererHandlers = {
  environment: {
    getState(): Promise<EnvironmentState>;
    updateState(input: EnvironmentUpdatePayload): void;
    stateChanged(input: EnvironmentState): void;
    grabBoosts(): Promise<string[]>;
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
      attackPriority: string;
      copyWalk: boolean;
      name: string;
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
    reloadHotkeys(): Promise<void>;
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
