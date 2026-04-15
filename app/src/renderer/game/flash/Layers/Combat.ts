import { extractMonsterMapId, isMonsterMapId, type Monster } from "@vexed/game";
import { Effect, Layer, Option, Schedule } from "effect";
import { Bridge } from "../Services/Bridge";
import { Combat } from "../Services/Combat";
import type { CombatShape } from "../Services/Combat";
import { Drops } from "../Services/Drops";
import { PacketDomain } from "../Services/PacketDomain";
import { Player } from "../Services/Player";
import { World } from "../Services/World";

const SKILL_ROTATION: readonly Skill[] = [1, 2, 3, 4];

type ResolvedKillTarget =
  | {
      readonly kind: "monMapId";
      readonly monMapId: number;
    }
  | {
      readonly kind: "name";
      readonly name: string;
    };

const normalizeMonsterName = (value: string) => value.trim().toLowerCase();

const matchesMonsterName = (left: string, right: string) => {
  const normalizedLeft = normalizeMonsterName(left);
  const normalizedRight = normalizeMonsterName(right);

  if (normalizedLeft === "*") {
    return true;
  }

  return normalizedRight.includes(normalizedLeft);
};

const toMonMapId = (target: MonsterIdentifierToken): number | undefined => {
  if (typeof target === "number") {
    return Number.isFinite(target) && target > 0 ? target : undefined;
  }

  const trimmed = target.trim();
  if (!isMonsterMapId(trimmed)) {
    return undefined;
  }

  const parsed = Number.parseInt(extractMonsterMapId(trimmed), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const resolveKillTarget = (
  target: MonsterIdentifierToken,
): ResolvedKillTarget => {
  const monMapId = toMonMapId(target);
  if (monMapId !== undefined) {
    return { kind: "monMapId", monMapId };
  }

  return { kind: "name", name: String(target).trim() };
};

const INTEGER_TOKEN_PATTERN = /^\d+$/;

const resolveItemIdentifier = (
  item: ItemIdentifierToken,
): ItemIdentifierToken | undefined => {
  if (typeof item === "number") {
    return Number.isFinite(item) && item > 0 ? Math.trunc(item) : undefined;
  }

  const trimmed = item.trim();
  if (trimmed === "") {
    return undefined;
  }

  if (INTEGER_TOKEN_PATTERN.test(trimmed)) {
    const itemId = Number.parseInt(trimmed, 10);
    return Number.isFinite(itemId) && itemId > 0 ? itemId : undefined;
  }

  return trimmed;
};

const normalizeItemQuantity = (quantity?: number): number | undefined => {
  if (quantity === undefined || !Number.isFinite(quantity)) {
    return undefined;
  }

  const normalized = Math.trunc(quantity);
  return normalized > 0 ? normalized : undefined;
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const drops = yield* Drops;
  const player = yield* Player;

  const isValidSkillIndex = (index: Skill) => {
    const idx = Number.parseInt(String(index));
    return idx >= 0 && idx <= 5;
  };

  const attackMonster = (monster: MonsterIdentifierToken) =>
    Effect.gen(function* () {
      const resolved = resolveKillTarget(monster);
      if (resolved.kind === "monMapId") {
        return yield* bridge.call("combat.attackMonsterById", [
          resolved.monMapId,
        ]);
      }

      return yield* bridge.call("combat.attackMonster", [resolved.name]);
    });

  const cancelAutoAttack = () => bridge.call("combat.cancelAutoAttack");

  const cancelTarget = () => bridge.call("combat.cancelTarget");

  const getSkillCooldownRemaining = (index: number | string) =>
    Effect.gen(function* () {
      const idx = Number.parseInt(String(index));
      if (!isValidSkillIndex(idx)) return yield* Effect.succeed(0);

      return yield* bridge.call("combat.getSkillCooldownRemaining", [idx]);
    });

  const useSkill = (index: Skill, force?: boolean, wait?: boolean) =>
    Effect.gen(function* () {
      const strIndex = String(index);
      const idx = Number.parseInt(strIndex);
      if (!isValidSkillIndex(idx)) return yield* Effect.void;

      if (wait) {
        const duration = yield* bridge.call(
          "combat.getSkillCooldownRemaining",
          [idx],
        );
        yield* Effect.sleep(duration);
      }

      if (force) {
        yield* bridge.call("combat.forceUseSkill", [strIndex]);
        return;
      }

      yield* bridge.call("combat.useSkill", [strIndex]);
    });

  const hasTarget = () => bridge.call("combat.hasTarget");

  const getTarget: CombatShape["getTarget"] = () =>
    bridge.call("combat.getTarget");

  const containsInventoryItem = (
    item: ItemIdentifierToken,
    quantity?: number,
  ) =>
    quantity === undefined
      ? bridge.call("inventory.contains", [item])
      : bridge.call("inventory.contains", [item, quantity]);

  const containsTempInventoryItem = (
    item: ItemIdentifierToken,
    quantity?: number,
  ) =>
    quantity === undefined
      ? bridge.call("tempInventory.contains", [item])
      : bridge.call("tempInventory.contains", [item, quantity]);

  const stopCombat = Effect.gen(function* () {
    yield* cancelAutoAttack().pipe(Effect.catch(() => Effect.void));
    yield* cancelTarget().pipe(Effect.catch(() => Effect.void));
  });

  const kill: CombatShape["kill"] = (target) => {
    let disposeMonsterDeathListener: (() => void) | undefined;

    return Effect.gen(function* () {
      const maybeWorld = yield* Effect.serviceOption(World);
      if (Option.isNone(maybeWorld)) {
        return;
      }

      const world = maybeWorld.value;
      const resolvedTarget = resolveKillTarget(target);

      if (resolvedTarget.kind === "name" && resolvedTarget.name === "") {
        return;
      }

      const waitUntilPlayerAlive = () =>
        Effect.repeat(
          world.players.withSelf((me) => me.alive),
          {
            schedule: Schedule.spaced("250 millis"),
            until: (alive) => Option.isSome(alive) && alive.value,
          },
        ).pipe(Effect.asVoid);

      const resolveTargetMonMapIdByName = (name: string) =>
        Effect.gen(function* () {
          const meCell = yield* world.players.withSelf((me) => me.cell);
          const monster = yield* world.monsters.findByName(
            name,
            Option.isSome(meCell) ? meCell.value : undefined,
          );
          return Option.isSome(monster) ? monster.value.monMapId : undefined;
        });

      const getMonsterNameByMonMapId = (monMapId: number) =>
        world.monsters
          .get(monMapId)
          .pipe(
            Effect.map((monster) =>
              Option.isSome(monster) ? monster.value.name : undefined,
            ),
          );

      const isMonsterDead = (monMapId: number) =>
        world.monsters
          .get(monMapId)
          .pipe(
            Effect.map(
              (monster) =>
                Option.isNone(monster) ||
                !monster.value.alive ||
                monster.value.isDead(),
            ),
          );

      let didKillTarget = false;
      let targetMonMapId =
        resolvedTarget.kind === "monMapId"
          ? resolvedTarget.monMapId
          : undefined;
      let skillIndex = 0;

      const maybePacketDomain = yield* Effect.serviceOption(PacketDomain);
      if (Option.isSome(maybePacketDomain)) {
        disposeMonsterDeathListener = yield* maybePacketDomain.value.on(
          "monsterDeath",
          (event) =>
            Effect.gen(function* () {
              if (didKillTarget) {
                return;
              }

              if (targetMonMapId !== undefined) {
                if (event.monMapId === targetMonMapId) {
                  didKillTarget = true;
                }
                return;
              }

              if (resolvedTarget.kind !== "name") {
                return;
              }

              const deadMonsterName = yield* getMonsterNameByMonMapId(
                event.monMapId,
              );
              if (
                deadMonsterName !== undefined &&
                matchesMonsterName(resolvedTarget.name, deadMonsterName)
              ) {
                didKillTarget = true;
                targetMonMapId = event.monMapId;
              }
            }),
        );
      }

      while (!didKillTarget) {
        yield* waitUntilPlayerAlive();

        if (targetMonMapId === undefined && resolvedTarget.kind === "name") {
          targetMonMapId = yield* resolveTargetMonMapIdByName(
            resolvedTarget.name,
          );
        }

        if (targetMonMapId !== undefined) {
          yield* attackMonster(targetMonMapId);
        } else if (resolvedTarget.kind === "name") {
          yield* attackMonster(resolvedTarget.name);
        }

        const skill = SKILL_ROTATION[skillIndex % SKILL_ROTATION.length];
        skillIndex += 1;
        if (skill !== undefined) {
          yield* useSkill(skill);
        }

        if (targetMonMapId !== undefined) {
          didKillTarget = yield* isMonsterDead(targetMonMapId);
        }

        if (!didKillTarget) {
          yield* Effect.sleep("150 millis");
        }
      }
    }).pipe(
      Effect.ensuring(
        Effect.gen(function* () {
          yield* stopCombat;
          yield* Effect.sync(() => {
            disposeMonsterDeathListener?.();
          });
        }),
      ),
    );
  };

  const killUntil = (
    target: MonsterIdentifierToken,
    shouldStop: () => ReturnType<typeof hasTarget>,
  ) =>
    Effect.gen(function* () {
      const resolvedTarget = resolveKillTarget(target);
      if (resolvedTarget.kind === "name" && resolvedTarget.name === "") {
        return;
      }

      while (true) {
        const done = yield* shouldStop();
        if (done) {
          return;
        }

        yield* kill(target);
        yield* Effect.sleep("100 millis");
      }
    });

  const killForItem: CombatShape["killForItem"] = (target, item, quantity) => {
    const resolvedItem = resolveItemIdentifier(item);
    if (resolvedItem === undefined) {
      return Effect.void;
    }

    const normalizedQuantity = normalizeItemQuantity(quantity);

    return killUntil(target, () =>
      Effect.gen(function* () {
        const hasDrop = yield* drops.containsDrop(resolvedItem);
        if (hasDrop) {
          yield* drops.acceptDrop(resolvedItem);
        }
        return yield* containsInventoryItem(resolvedItem, normalizedQuantity);
      }),
    );
  };

  const killForTempItem: CombatShape["killForTempItem"] = (
    target,
    item,
    quantity,
  ) => {
    const resolvedItem = resolveItemIdentifier(item);
    if (resolvedItem === undefined) {
      return Effect.void;
    }

    const normalizedQuantity = normalizeItemQuantity(quantity);

    return killUntil(target, () =>
      containsTempInventoryItem(resolvedItem, normalizedQuantity),
    );
  };

  const hunt: CombatShape["hunt"] = (target, findMost = false) =>
    Effect.gen(function* () {
      const resolvedTarget = resolveKillTarget(target);

      const maybeWorld = yield* Effect.serviceOption(World);
      if (Option.isNone(maybeWorld)) {
        return "";
      }

      const world = maybeWorld.value;

      const allMonsters = yield* world.monsters.getAll();

      const matchingMonsters: Monster[] = [];
      for (const [, monster] of allMonsters) {
        if (resolvedTarget.kind === "monMapId") {
          if (monster.monMapId === resolvedTarget.monMapId) {
            matchingMonsters.push(monster);
          }
        } else if (matchesMonsterName(resolvedTarget.name, monster.name)) {
          matchingMonsters.push(monster);
        }
      }

      if (matchingMonsters.length === 0) {
        return "";
      }

      const cellCounts = new Map<string, number>();
      for (const monster of matchingMonsters) {
        const cell = monster.cell;
        cellCounts.set(cell, (cellCounts.get(cell) ?? 0) + 1);
      }

      let bestCell = "";
      if (findMost) {
        let maxCount = 0;
        for (const [cell, count] of cellCounts.entries()) {
          if (count > maxCount) {
            maxCount = count;
            bestCell = cell;
          }
        }
      } else {
        bestCell = matchingMonsters[0]?.cell ?? "";
      }

      if (bestCell === "") {
        return "";
      }

      const currentCell = yield* player.getCell();
      if (currentCell !== bestCell) {
        yield* player.jumpToCell(bestCell);

        const pads = yield* world.map.getCellPads();
        const validPad =
          pads.length > 0
            ? pads[Math.floor(Math.random() * pads.length)]
            : undefined;
        if (validPad !== undefined) {
          yield* player.jumpToCell(bestCell, validPad);
        }
      }

      return bestCell;
    });

  return {
    attackMonster,
    cancelAutoAttack,
    cancelTarget,
    useSkill,
    getSkillCooldownRemaining,
    getTarget,
    hasTarget,
    kill,
    killForItem,
    killForTempItem,
    hunt,
  } satisfies CombatShape;
});

export const CombatLive = Layer.effect(Combat, make);
