import { join } from "path";
import Config, { type ConfigError } from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { sleep } from "@vexed/utils";
import { Result } from "better-result";
import type { BrowserWindow } from "electron";
import type { ArmyConfigPayload, ArmyConfigRaw } from "~/shared/army/types";
import { DOCUMENTS_PATH } from "../constants";
import type { RendererHandlers } from "../tipc";

type PlayerStatus = {
  done: Set<string>;
  leader: string;
  playerList: Set<string>;
  windows: Map<string, BrowserWindow>;
};

const map: Map<string, PlayerStatus> = new Map();
const windowToPlayerMap: WeakMap<BrowserWindow, string> = new WeakMap();
const ARMY_STORAGE_PATH = join(DOCUMENTS_PATH, "storage");

function normalizeConfigName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return "";
  return trimmed.endsWith(".json") ? trimmed.slice(0, -5) : trimmed;
}

function formatConfigError(error: ConfigError): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function extractArmyCore(
  raw: ArmyConfigRaw,
): Result<Omit<ArmyConfigPayload, "configName" | "raw">, string> {
  const playerCount = raw.PlayerCount;
  if (
    typeof playerCount !== "number" ||
    !Number.isInteger(playerCount) ||
    playerCount < 1
  )
    return Result.err("PlayerCount must be a positive integer");

  const totalPlayers = playerCount;

  const roomValue = raw.RoomNumber;
  if (typeof roomValue !== "number" && typeof roomValue !== "string")
    return Result.err("RoomNumber is not set in config file");

  const roomNumber = String(roomValue).trim();
  if (!roomNumber) return Result.err("RoomNumber is not set in config file");

  const players: string[] = [];
  for (let idx = 1; idx <= totalPlayers; idx++) {
    const playerKey = `Player${idx}` as const;
    const player = raw[playerKey];
    if (typeof player !== "string" || !player.trim()) {
      return Result.err(`Player${idx} not set in config file`);
    }
    players.push(player.trim());
  }

  const leader = players[0] ?? "";
  if (!leader) return Result.err("Player1 not set in config file");

  return Result.ok({
    leader,
    players,
    roomNumber,
  });
}

const handleCleanup = (
  browserWindow: BrowserWindow,
  configFileName?: string,
) => {
  const _cleanup = () => {
    if (configFileName) map.delete(configFileName);
  };

  browserWindow.webContents.once("did-finish-load", _cleanup);
  browserWindow.once("close", _cleanup);
};

export const createArmyTipcRouter = (tipc: TipcInstance) => ({
  loadConfig: tipc.procedure
    .input<{ fileName: string }>()
    .action(async ({ input }) => {
      const configName = normalizeConfigName(input.fileName);
      if (!configName) {
        return Result.serialize(Result.err("Config name is required."));
      }

      const config = new Config<ArmyConfigRaw>({
        configName,
        cwd: ARMY_STORAGE_PATH,
      });
      const loaded = await config.load();
      if (loaded.isErr()) {
        return Result.serialize(
          Result.err(
            `Failed to load army config: ${formatConfigError(loaded.error)}`,
          ),
        );
      }

      const raw = config.get();
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return Result.serialize(
          Result.err("Army config must be a JSON object."),
        );
      }

      const core = extractArmyCore(raw);
      if (core.isErr()) {
        return Result.serialize(Result.err(core.error));
      }

      return Result.serialize(
        Result.ok({
          configName,
          leader: core.value.leader,
          players: core.value.players,
          raw,
          roomNumber: core.value.roomNumber,
        } satisfies ArmyConfigPayload),
      );
    }),

  init: tipc.procedure
    .input<{
      fileName: string;
      playerName: string;
      players: string[];
    }>()
    .requireSenderWindow()
    .action(async ({ input, context }) => {
      const browserWindow = context.senderWindow;
      const { fileName, playerName, players } = input;
      const windows = new Map<string, BrowserWindow>();
      windows.set(playerName, browserWindow);
      windowToPlayerMap.set(browserWindow, playerName);
      const playerStatus: PlayerStatus = {
        done: new Set<string>(),
        leader: playerName,
        playerList: new Set(players),
        windows,
      };
      map.set(fileName, playerStatus);
      handleCleanup(browserWindow, fileName);
    }),

  join: tipc.procedure
    .input<{
      fileName: string;
      playerName: string;
    }>()
    .requireSenderWindow()
    .action(async ({ input, context }) => {
      const browserWindow = context.senderWindow;
      const { fileName, playerName } = input;
      let iter = 0;
      while (!map.has(fileName)) {
        await sleep(100);
        iter++;
      }

      await sleep(1_000);
      const { windows } = map.get(fileName)!;
      windows.set(playerName, browserWindow);
      windowToPlayerMap.set(browserWindow, playerName);
      handleCleanup(browserWindow);
    }),

  finishJob: tipc.procedure
    .requireSenderWindow()
    .action(async ({ context }) => {
      const browserWindow = context.senderWindow;
      const playerName = windowToPlayerMap.get(browserWindow);
      if (!playerName) return;

      const fileName = [...map.keys()].find((fileName) =>
        map.get(fileName)?.windows.has(playerName),
      );
      if (!fileName) return;

      const { done: doneSet, windows, playerList, leader } = map.get(fileName)!;
      doneSet.add(playerName);
      if (playerName !== leader) return;

      let iter = 0;
      while (doneSet.size !== playerList.size && map.has(fileName)) {
        await sleep(100);
        iter++;
      }

      if (!map.has(fileName)) return;
      for (const [_, window] of windows) {
        const rendererHandlers =
          context.getRendererHandlers<RendererHandlers>(window);
        await rendererHandlers.army.armyReady.invoke();
      }

      doneSet.clear();
    }),
});
