import { Faction, type FactionData } from "@vexed/game";
import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Player } from "../Services/Player";
import type { PlayerShape } from "../Services/Player";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFactionData = (value: unknown): value is FactionData => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["CharFactionID"] === "string" &&
    typeof value["FactionID"] === "string" &&
    typeof value["iRank"] === "number" &&
    typeof value["iRep"] === "number" &&
    typeof value["iRepToRank"] === "number" &&
    typeof value["iSpillRep"] === "number" &&
    typeof value["sName"] === "string"
  );
};

const normalizePosition = (value: unknown[]): [number, number] => {
  const x = Number(value[0] ?? 0);
  const y = Number(value[1] ?? 0);

  return [
    Number.isFinite(x) ? x : 0,
    Number.isFinite(y) ? y : 0,
  ] as [number, number];
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  const getCell = () => bridge.call("player.getCell");

  const getClassName = () => bridge.call("player.getClassName");

  const getData = () => bridge.call("player.getData");

  const getFactions = () =>
    Effect.map(bridge.call("player.getFactions"), (factions) =>
      factions
        .filter(isFactionData)
        .map((factionData) => new Faction(factionData)),
    );

  const getGender = () => bridge.call("player.getGender");

  const getGold = () => bridge.call("player.getGold");

  const getHp = () => bridge.call("player.getHp");

  const getLevel = () => bridge.call("player.getLevel");

  const getMap = () => bridge.call("player.getMap");

  const getMaxHp = () => bridge.call("player.getMaxHp");

  const getMaxMp = () => bridge.call("player.getMaxMp");

  const getMp = () => bridge.call("player.getMp");

  const getPad = () => bridge.call("player.getPad");

  const getPosition = () =>
    Effect.map(bridge.call("player.getPosition"), normalizePosition);

  const getState = () => bridge.call("player.getState");

  const getUserId = () => bridge.call("player.getUserId");

  const isAfk = () => bridge.call("player.isAfk");

  const isLoaded = () => bridge.call("player.isLoaded");

  const isMember = () => bridge.call("player.isMember");

  const jump = (cell: string, pad?: string) =>
    pad === undefined
      ? bridge.call("player.jump", [cell])
      : bridge.call("player.jump", [cell, pad]);

  const joinMap = (map: string, cell?: string, pad?: string) => {
    if (cell === undefined && pad === undefined) {
      return bridge.call("player.joinMap", [map]);
    }

    if (cell !== undefined && pad === undefined) {
      return bridge.call("player.joinMap", [map, cell]);
    }

    return bridge.call("player.joinMap", [map, cell ?? "Enter", pad]);
  };

  const goToPlayer = (name: string) => bridge.call("player.goToPlayer", [name]);

  const rest = () => bridge.call("player.rest");

  const useBoost = (itemId: number) => bridge.call("player.useBoost", [itemId]);

  const hasActiveBoost = (boostType: string) =>
    bridge.call("player.hasActiveBoost", [boostType]);

  const isAlive = () => Effect.map(getHp(), (hp) => hp > 0);

  const walkTo = (x: number, y: number, walkSpeed?: number) =>
    Effect.flatMap(isAlive(), (alive) => {
      if (!alive) {
        return Effect.succeed(false);
      }

      return walkSpeed === undefined
        ? bridge.call("player.walkTo", [x, y])
        : bridge.call("player.walkTo", [x, y, walkSpeed]);
    });

  return {
    getCell,
    getClassName,
    getData,
    getFactions,
    getGender,
    getGold,
    getHp,
    getLevel,
    getMap,
    getMaxHp,
    getMaxMp,
    getMp,
    getPad,
    getPosition,
    getState,
    getUserId,
    isAfk,
    isLoaded,
    isMember,
    jump,
    joinMap,
    goToPlayer,
    rest,
    useBoost,
    hasActiveBoost,
    isAlive,
    walkTo,
  } satisfies PlayerShape;
});

export const PlayerLive = Layer.effect(Player, make);
