import {
  EntityState,
  type Aura,
  type AvatarData,
  type ItemData,
  type MonsterData,
} from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/shared/string";
import { readCsvValue } from "@vexed/shared/csv";
import { Effect, Layer, Option } from "effect";
import type {
  PacketDomainEvent,
  PacketDomainEventHandler,
  PacketDomainEventMap,
  PacketDomainShape,
} from "../Services/PacketDomain";
import { PacketDomain } from "../Services/PacketDomain";
import { Auth } from "../Services/Auth";
import { Drops } from "../Services/Drops";
import {
  PacketHandler,
  type PacketHandlerDisposer,
} from "../Services/PacketHandler";
import { World } from "../Services/World";

const AURA_ADD_COMMANDS = new Set(["aura+", "aura++"]);
const AURA_REMOVE_COMMANDS = new Set(["aura-", "aura--"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  isRecord(value) ? value : null;

const asArray = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const asBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

const isItemData = (value: unknown): value is ItemData => {
  const record = asRecord(value);
  if (!record) {
    return false;
  }

  return (
    typeof record["ItemID"] === "number" &&
    typeof record["iQty"] === "number" &&
    typeof record["sName"] === "string"
  );
};

const toAvatarData = (
  username: string,
  payload: Record<string, unknown>,
): AvatarData | undefined => {
  const entID = asNumber(payload["entID"]);
  const uoName = asString(payload["uoName"]);

  if (entID === undefined || !uoName) {
    return undefined;
  }

  return {
    afk: asBoolean(payload["afk"]) ?? false,
    entID,
    entType: asString(payload["entType"]) ?? "player",
    intHP: asNumber(payload["intHP"]) ?? 0,
    intHPMax: asNumber(payload["intHPMax"]) ?? 0,
    intLevel: asNumber(payload["intLevel"]) ?? 0,
    intMP: asNumber(payload["intMP"]) ?? 0,
    intMPMax: asNumber(payload["intMPMax"]) ?? 0,
    intState: asNumber(payload["intState"]) ?? EntityState.Idle,
    strFrame: asString(payload["strFrame"]) ?? "",
    strPad: asString(payload["strPad"]) ?? "",
    strUsername: username,
    tx: asNumber(payload["tx"]) ?? 0,
    ty: asNumber(payload["ty"]) ?? 0,
    uoName,
  };
};

const patchAvatarData = (
  data: AvatarData,
  payload: Record<string, unknown>,
) => {
  const intHP = asNumber(payload["intHP"]);
  const intMP = asNumber(payload["intMP"]);
  const intHPMax = asNumber(payload["intHPMax"]);
  const intMPMax = asNumber(payload["intMPMax"]);
  const intState = asNumber(payload["intState"]);
  const strFrame = asString(payload["strFrame"]);
  const strPad = asString(payload["strPad"]);
  const tx = asNumber(payload["tx"]);
  const ty = asNumber(payload["ty"]);
  const afk = asBoolean(payload["afk"]);
  if (intHP !== undefined) data.intHP = intHP;
  if (intMP !== undefined) data.intMP = intMP;
  if (intHPMax !== undefined) data.intHPMax = intHPMax;
  if (intMPMax !== undefined) data.intMPMax = intMPMax;
  if (intState !== undefined) data.intState = intState;
  if (strFrame !== undefined) data.strFrame = strFrame;
  if (strPad !== undefined) data.strPad = strPad;
  if (tx !== undefined) data.tx = tx;
  if (ty !== undefined) data.ty = ty;
  if (afk !== undefined) data.afk = afk;
};

const registerScoped = (registration: Effect.Effect<PacketHandlerDisposer>) =>
  Effect.acquireRelease(registration, (dispose) => Effect.sync(dispose));

type DomainHandlerStore = {
  [K in PacketDomainEvent]: Set<PacketDomainEventHandler<K>>;
};

const createDomainHandlerStore = (): DomainHandlerStore => ({
  monsterDeath: new Set(),
  joinMap: new Set(),
  zone: new Set(),
});

const registerDomainHandler = <E extends PacketDomainEvent>(
  store: DomainHandlerStore,
  event: E,
  handler: PacketDomainEventHandler<E>,
): Effect.Effect<PacketHandlerDisposer> =>
  Effect.sync(() => {
    const handlers = store[event] as
      | Set<PacketDomainEventHandler<E>>
      | undefined;

    if (!handlers) {
      throw new Error(`packet domain event store missing: ${event}`);
    }

    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  });

const dispatchDomainEvent = <E extends PacketDomainEvent>(
  store: DomainHandlerStore,
  event: E,
  payload: PacketDomainEventMap[E],
): Effect.Effect<void> => {
  const eventHandlers = store[event] as
    | Set<PacketDomainEventHandler<E>>
    | undefined;

  if (!eventHandlers) {
    return Effect.logError(`packet domain event store missing: ${event}`).pipe(
      Effect.asVoid,
    );
  }

  const handlers = Array.from(
    eventHandlers,
  ) as readonly PacketDomainEventHandler<E>[];

  if (handlers.length === 0) {
    return Effect.void;
  }

  return Effect.forEach(
    handlers,
    (handler, handlerIndex) =>
      handler(payload).pipe(
        Effect.catchCause((cause) =>
          Effect.logError({
            message: "packet domain callback failed",
            event,
            handlerIndex,
            cause,
          }),
        ),
      ),
    { discard: true },
  );
};

const make = Effect.gen(function* () {
  const auth = yield* Auth;
  const drops = yield* Drops;
  const packetHandler = yield* PacketHandler;
  const world = yield* World;
  const domainHandlerStore = createDomainHandlerStore();

  const on = <E extends PacketDomainEvent>(
    event: E,
    handler: PacketDomainEventHandler<E>,
  ) => registerDomainHandler(domainHandlerStore, event, handler);

  const withMonster = (
    monMapId: number,
    f: (monster: { data: MonsterData }) => void,
  ) =>
    world.monsters
      .get(monMapId)
      .pipe(
        Effect.flatMap((monster) =>
          Option.isSome(monster)
            ? Effect.sync(() => f(monster.value))
            : Effect.void,
        ),
      );

  const withPlayerByName = (
    name: string,
    f: (player: { data: AvatarData }) => void,
  ) =>
    world.players
      .getByName(name)
      .pipe(
        Effect.flatMap((player) =>
          Option.isSome(player)
            ? Effect.sync(() => f(player.value))
            : Effect.void,
        ),
      );

  const withSelf = (f: (player: { data: AvatarData }) => void) =>
    world.players
      .getSelf()
      .pipe(
        Effect.flatMap((player) =>
          Option.isSome(player)
            ? Effect.sync(() => f(player.value))
            : Effect.void,
        ),
      );

  const registerJson = (
    cmd: string,
    handler: Parameters<typeof packetHandler.registerExtensionType>[2],
  ) =>
    registerScoped(packetHandler.registerExtensionType("json", cmd, handler));

  const registerStr = (
    cmd: string,
    handler: Parameters<typeof packetHandler.registerExtensionType>[2],
  ) => registerScoped(packetHandler.registerExtensionType("str", cmd, handler));

  yield* registerJson("dropItem", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      if (!payload) {
        return;
      }

      const items = asRecord(payload["items"]);
      if (!items) {
        return;
      }

      for (const item of Object.values(items)) {
        if (!isItemData(item)) {
          continue;
        }

        yield* drops._addDrop(item).pipe(Effect.catch(() => Effect.void));
      }
    }),
  );

  yield* registerJson("event", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      if (!payload || !payload["args"]) {
        return;
      }

      const args = asRecord(payload["args"]);
      if (!args) {
        return;
      }
      const zone = asString(args["zoneSet"]) ?? "";
      const map = yield* world.map.getName();

      yield* dispatchDomainEvent(domainHandlerStore, "zone", {
        map,
        zone,
        packet,
      });
    }),
  );

  yield* registerJson("initUserData", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      const data = payload ? asRecord(payload["data"]) : null;
      const username = data ? asString(data["strUsername"]) : undefined;
      const uid = payload ? asNumber(payload["uid"]) : undefined;

      if (!username || uid === undefined) {
        return;
      }

      yield* world.players.register(username, uid);
    }),
  );

  yield* registerJson("initUserDatas", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      if (!payload) {
        return;
      }

      for (const rawUser of asArray(payload["a"])) {
        const user = asRecord(rawUser);
        const data = user ? asRecord(user["data"]) : null;
        const username = data ? asString(data["strUsername"]) : undefined;
        const uid = user ? asNumber(user["uid"]) : undefined;

        if (!username || uid === undefined) {
          continue;
        }

        yield* world.players.register(username, uid);
      }
    }),
  );

  yield* registerStr("exitArea", (packet) =>
    Effect.gen(function* () {
      const data = asArray(packet.data);
      if (!data) {
        return;
      }

      const username = asString(data[3]);
      if (!username) {
        return;
      }

      yield* world.players.unregister(username);
      yield* world.players.remove(username);
    }),
  );

  yield* registerJson("moveToArea", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      if (!payload) {
        return;
      }

      yield* world.map.reset();

      // Map Info

      const mapNameNumber = asString(payload["areaName"]);
      const parts = mapNameNumber?.split("-") ?? [];
      const mapId = asNumber(payload["areaId"]);

      if (parts.length === 2) {
        const [mapName, roomNumberStr] = parts;
        const roomNumber = asNumber(roomNumberStr);

        if (mapName) {
          yield* world.map.setName(mapName);
        }

        if (roomNumber !== undefined) {
          yield* world.map.setRoomNumber(roomNumber);
        }
      }

      if (mapId !== undefined) {
        yield* world.map.setId(mapId);
      }

      // Monster info

      const monDefs = new Map(
        asArray(payload["mondef"]).flatMap((raw) => {
          const def = asRecord(raw);
          const monId = asNumber(def?.["MonID"]);
          return monId !== undefined
            ? [
                [
                  monId,
                  {
                    sRace: asString(def!["sRace"]) ?? "Unknown",
                    strMonName: asString(def!["strMonName"]) ?? "Unknown",
                  },
                ],
              ]
            : [];
        }),
      );

      const monMaps = new Map(
        asArray(payload["monmap"]).flatMap((raw) => {
          const map = asRecord(raw);
          const monMapId = asNumber(map?.["MonMapID"]);
          return monMapId !== undefined
            ? [[monMapId, asString(map!["strFrame"]) ?? ""]]
            : [];
        }),
      );

      for (const rawMonster of asArray(payload["monBranch"])) {
        const monster = asRecord(rawMonster);
        const monId = asNumber(monster?.["MonID"]);
        const monMapId = asNumber(monster?.["MonMapID"]);
        if (monId === undefined || monMapId === undefined) continue;

        const def = monDefs.get(monId);
        const monsterData: MonsterData = {
          monId,
          monMapId,
          iLvl: asNumber(monster!["iLvl"]) ?? 0,
          intHP: asNumber(monster!["intHP"]) ?? 0,
          intHPMax: asNumber(monster!["intHPMax"]) ?? 0,
          intMP: asNumber(monster!["intMP"]) ?? 0,
          intMPMax: asNumber(monster!["intMPMax"]) ?? 0,
          intState: asNumber(monster!["intState"]) ?? EntityState.Idle,
          sRace: def?.sRace ?? "Unknown",
          strMonName: def?.strMonName ?? "Unknown",
          strFrame: monMaps.get(monMapId) ?? "",
        };
        yield* world.monsters.add(monsterData);
      }

      // Player info

      const currentUsername = yield* auth
        .getUsername()
        .pipe(Effect.orElseSucceed(() => ""));

      for (const rawPlayer of asArray(payload["uoBranch"])) {
        const player = asRecord(rawPlayer);
        if (!player) {
          continue;
        }

        const username = asString(player["strUsername"]);
        const uoName = asString(player["uoName"]);
        const entID = asNumber(player["entID"]);

        if (!username || !uoName || entID === undefined) {
          continue;
        }

        const avatar: AvatarData = {
          afk: asBoolean(player["afk"]) ?? false,
          entID,
          entType: asString(player["entType"]) ?? "player",
          intHP: asNumber(player["intHP"]) ?? 0,
          intHPMax: asNumber(player["intHPMax"]) ?? 0,
          intLevel: asNumber(player["intLevel"]) ?? 0,
          intMP: asNumber(player["intMP"]) ?? 0,
          intMPMax: asNumber(player["intMPMax"]) ?? 0,
          intState: asNumber(player["intState"]) ?? EntityState.Idle,
          strFrame: asString(player["strFrame"]) ?? "",
          strPad: asString(player["strPad"]) ?? "",
          strUsername: username,
          tx: asNumber(player["tx"]) ?? 0,
          ty: asNumber(player["ty"]) ?? 0,
          uoName,
        };

        yield* world.players.add(avatar);

        if (
          currentUsername !== "" &&
          equalsIgnoreCase(avatar.strUsername, currentUsername)
        ) {
          yield* world.players.setSelf(avatar.strUsername);
        }
      }
    }),
  );

  yield* registerJson("mtls", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      if (!payload) {
        return;
      }

      const monMapId = asNumber(payload["id"]);
      const monsterPayload = asRecord(payload["o"]);

      if (monMapId === undefined || !monsterPayload) {
        return;
      }

      yield* withMonster(monMapId, (monster) => {
        const intHP = asNumber(monsterPayload["intHP"]);
        if (intHP !== undefined) {
          monster.data.intHP = intHP;
        }

        const intMP = asNumber(monsterPayload["intMP"]);
        if (intMP !== undefined) {
          monster.data.intMP = intMP;
        }

        const intState = asNumber(monsterPayload["intState"]);
        if (intState !== undefined) {
          monster.data.intState = intState;
        }
      });
    }),
  );

  yield* registerJson("uotls", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      if (!payload) {
        return;
      }

      const username = asString(payload["unm"]);
      const userPayload = asRecord(payload["o"]);
      if (!username || !userPayload) {
        return;
      }

      const existing = yield* world.players.get(username);
      if (Option.isNone(existing)) {
        const avatar = toAvatarData(username, userPayload);
        if (avatar) {
          yield* world.players.add(avatar);
        }
        return;
      }

      patchAvatarData(existing.value.data, userPayload);
    }),
  );

  yield* registerJson("addGoldExp", (packet) =>
    Effect.gen(function* () {
      const payload = asRecord(packet.data);
      if (!payload || asString(payload["typ"]) !== "m") {
        return;
      }

      const monMapId = asNumber(payload["id"]);
      if (monMapId === undefined) {
        return;
      }

      yield* withMonster(monMapId, (monster) => {
        monster.data.intState = EntityState.Dead;
        monster.data.intHP = 0;
        monster.data.intMP = 0;
      });

      yield* world.monsters.clearAuras(monMapId);

      yield* dispatchDomainEvent(domainHandlerStore, "monsterDeath", {
        monMapId,
        packet,
      });
    }),
  );

  yield* registerJson("clearAuras", () =>
    Effect.gen(function* () {
      const me = yield* world.players.getSelf();
      if (Option.isNone(me)) {
        return;
      }

      yield* world.players.clearAuras(me.value.data.entID);
    }),
  );

  yield* registerStr("respawnMon", (packet) =>
    Effect.gen(function* () {
      const payload = asArray(packet.data);
      const monMapId = asNumber(payload[2]);
      if (monMapId === undefined) {
        return;
      }

      yield* withMonster(monMapId, (monster) => {
        monster.data.intHP = monster.data.intHPMax;
        monster.data.intMP = monster.data.intMPMax;
        monster.data.intState = EntityState.Idle;
      });
    }),
  );

  yield* registerStr("uotls", (packet) =>
    Effect.gen(function* () {
      const payload = asArray(packet.data);
      const username = asString(payload[2]);
      const data = asString(payload[3]);

      if (!username || !data) {
        return;
      }

      const player = yield* world.players.getByName(username);
      if (Option.isNone(player)) {
        return;
      }

      const playerData = player.value.data;

      if (data.startsWith("afk:")) {
        const afk = asBoolean(readCsvValue(data, "afk:"));
        if (afk !== undefined) {
          playerData.afk = afk;
        }
        return;
      }

      if (data.startsWith("sp:")) {
        const tx = asNumber(readCsvValue(data, "tx:"));
        const ty = asNumber(readCsvValue(data, "ty:"));
        const cell = readCsvValue(data, "strFrame:");

        if (tx !== undefined) {
          playerData.tx = tx;
        }
        if (ty !== undefined) {
          playerData.ty = ty;
        }
        if (cell !== undefined) {
          playerData.strFrame = cell;
        }
        return;
      }

      if (data.startsWith("mvts:")) {
        const tx = asNumber(readCsvValue(data, "px:"));
        const ty = asNumber(readCsvValue(data, "py:"));
        const cell = readCsvValue(data, "strFrame:");
        const pad = readCsvValue(data, "strPad:");

        if (cell !== undefined) {
          playerData.strFrame = cell;
        }
        if (pad !== undefined) {
          playerData.strPad = pad;
        }
        if (tx !== undefined) {
          playerData.tx = tx;
        }
        if (ty !== undefined) {
          playerData.ty = ty;
        }
      }
    }),
  );

  yield* registerScoped(
    packetHandler.registerClient("moveToCell", (packet) =>
      Effect.gen(function* () {
        yield* withSelf((me) => {
          const cell = packet.params[4];
          const pad = packet.params[5];

          if (!cell || !pad) {
            return;
          }

          me.data.strFrame = cell;
          me.data.strPad = pad;
        });
      }),
    ),
  );

  yield* registerScoped(
    packetHandler.registerClient("mv", (packet) =>
      withSelf((me) => {
        const tx = asNumber(packet.params[4]);
        const ty = asNumber(packet.params[5]);

        if (tx !== undefined) {
          me.data.tx = tx;
        }

        if (ty !== undefined) {
          me.data.ty = ty;
        }
      }),
    ),
  );

  yield* registerScoped(
    packetHandler.registerServer("ct", (packet) =>
      Effect.gen(function* () {
        const payload = asRecord(packet.data);
        if (!payload) {
          return;
        }

        const playerUpdates = asRecord(payload["p"]);
        if (playerUpdates) {
          for (const [playerName, rawUpdate] of Object.entries(playerUpdates)) {
            const update = asRecord(rawUpdate);
            if (!update) {
              continue;
            }

            let deadPlayerEntityId: number | undefined;

            yield* withPlayerByName(playerName, (player) => {
              const intState = asNumber(update["intState"]);
              if (intState !== undefined) {
                player.data.intState = intState;
              }

              const intHP = asNumber(update["intHP"]);
              if (intHP !== undefined) {
                player.data.intHP = intHP;
              }

              const intMP = asNumber(update["intMP"]);
              if (intMP !== undefined) {
                player.data.intMP = intMP;
              }

              if (
                player.data.intState === EntityState.Dead &&
                player.data.intHP === 0
              ) {
                deadPlayerEntityId = player.data.entID;
              }
            });

            if (deadPlayerEntityId !== undefined) {
              yield* world.players.clearAuras(deadPlayerEntityId);
            }
          }
        }

        const auraEvents = asArray(payload["a"]);
        for (const rawAuraEvent of auraEvents) {
          const auraEvent = asRecord(rawAuraEvent);
          if (!auraEvent) {
            continue;
          }

          const cmd = asString(auraEvent["cmd"]);
          const targetInfo = asString(auraEvent["tInf"]);
          if (!cmd || !targetInfo) {
            continue;
          }

          const [targetType, rawTargetId] = targetInfo.split(":");
          const targetId = asNumber(rawTargetId);

          if (
            targetId === undefined ||
            (targetType !== "m" && targetType !== "p")
          ) {
            continue;
          }

          if (AURA_ADD_COMMANDS.has(cmd)) {
            for (const rawAura of asArray(auraEvent["auras"])) {
              const auraPayload = asRecord(rawAura);
              const auraName = auraPayload
                ? asString(auraPayload["nam"])
                : undefined;

              if (!auraPayload || !auraName) {
                continue;
              }

              const aura: Aura = {
                name: auraName,
                duration: asNumber(auraPayload["dur"]) ?? 0,
              };

              const value = asNumber(auraPayload["val"]);
              if (value !== undefined) {
                aura.value = value;
              }

              const isNew = auraPayload["isNew"] === true;
              if (targetType === "p") {
                if (isNew) {
                  yield* world.players.addAura(targetId, aura);
                } else {
                  yield* world.players.updateAura(targetId, aura);
                }
              } else {
                if (isNew) {
                  yield* world.monsters.addAura(targetId, aura);
                } else {
                  yield* world.monsters.updateAura(targetId, aura);
                }
              }
            }
            continue;
          }

          if (AURA_REMOVE_COMMANDS.has(cmd)) {
            const aura = asRecord(auraEvent["aura"]);
            const auraName = aura ? asString(aura["nam"]) : undefined;
            if (!auraName) {
              continue;
            }

            if (targetType === "p") {
              yield* world.players.removeAura(targetId, auraName);
            } else {
              yield* world.monsters.removeAura(targetId, auraName);
            }
          }
        }

        const monsterUpdates = asRecord(payload["m"]);
        if (!monsterUpdates) {
          return;
        }

        for (const [rawMonMapId, rawUpdate] of Object.entries(monsterUpdates)) {
          const monMapId = asNumber(rawMonMapId);
          const update = asRecord(rawUpdate);

          if (monMapId === undefined || !update) {
            continue;
          }

          yield* withMonster(monMapId, (monster) => {
            const intHP = asNumber(update["intHP"]);
            if (intHP !== undefined) {
              monster.data.intHP = intHP;
            }

            const intMP = asNumber(update["intMP"]);
            if (intMP !== undefined) {
              monster.data.intMP = intMP;
            }

            const intState = asNumber(update["intState"]);
            if (intState !== undefined) {
              monster.data.intState = intState;
            }
          });
        }
      }),
    ),
  );

  return {
    started: true,
    on,
  } satisfies PacketDomainShape;
});

export const PacketDomainLive = Layer.effect(PacketDomain, make);
