import { tipc, type ClientFromRouter } from "@vexed/tipc";
import type {
  EnvironmentState,
  EnvironmentUpdatePayload,
  FastTravel,
  FastTravelRoomNumber,
  GrabberDataType,
  HotkeyConfig,
  LoaderDataType,
} from "../shared/types";
import { createAppTipcRouter } from "./tipc/app.router";
import { createArmyTipcRouter } from "./tipc/army.router";
import { createEnvironmentTipcRouter } from "./tipc/environment.router";
import { createFastTravelsTipcRouter } from "./tipc/fast-travels.router";
import { createFollowerTipcRouter } from "./tipc/follower.router";
import { createHotkeysTipcRouter } from "./tipc/hotkeys.router";
import { createLoaderGrabberTipcRouter } from "./tipc/loader-grabber.router";
import { createManagerTipcRouter } from "./tipc/manager.router";
import { createPacketTipcRouter } from "./tipc/packets.router";
import type { TipcResult } from "./tipc/result";
import { createScriptsTipcRouter } from "./tipc/scripts.router";

const tipcInstance = tipc.create();

export const router = {
  scripts: createScriptsTipcRouter(tipcInstance),
  fastTravels: createFastTravelsTipcRouter(tipcInstance),
  loaderGrabber: createLoaderGrabberTipcRouter(tipcInstance),
  follower: createFollowerTipcRouter(tipcInstance),
  packets: createPacketTipcRouter(tipcInstance),
  hotkeys: createHotkeysTipcRouter(tipcInstance),
  manager: createManagerTipcRouter(tipcInstance),
  army: createArmyTipcRouter(tipcInstance),
  environment: createEnvironmentTipcRouter(tipcInstance),
  app: createAppTipcRouter(tipcInstance),
};

export type TipcRouter = typeof router;

// Declares the shape of the handlers that main process can call for the renderer processes.

/* eslint-disable typescript-sort-keys/interface */

export type RendererHandlers = {
  environment: {
    getState(): Promise<EnvironmentState>;
    updateState(input: EnvironmentUpdatePayload): void;
    stateChanged(input: EnvironmentState): void;
    grabBoosts(): Promise<string[]>;
  };

  game: {
    gameReloaded(): void;
  };

  scripts: {
    scriptLoaded(fromManager: boolean): void;
    gameReload(): void;
  };

  fastTravels: {
    enable(): void;
    warp({ location }: { location: FastTravelRoomNumber }): void;
    all(): Promise<TipcResult<FastTravel[]>>;
    add(
      input: FastTravel,
    ): Promise<TipcResult<"FAILED" | "NAME_ALREADY_EXISTS" | "SUCCESS">>;
    update(input: {
      fastTravel: FastTravel;
      originalName: string;
    }): Promise<
      TipcResult<"FAILED" | "NAME_ALREADY_EXISTS" | "NOT_FOUND" | "SUCCESS">
    >;
    remove(input: { name: string }): Promise<TipcResult<boolean>>;
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
    all(): Promise<HotkeyConfig>;
    update(input: {
      configKey: string;
      id: string;
      value: string;
    }): Promise<void>;
    restore(): Promise<void>;
    reload(): Promise<void>;
  };
  packets: ClientFromRouter<ReturnType<typeof createPacketTipcRouter>>;

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
    onLogin(username: string): Promise<void>;
  };
};
/* eslint-enable typescript-sort-keys/interface */
