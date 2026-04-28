import { extractMonsterMapId, isMonsterMapId, Monster } from "@vexed/game";
import { Effect, Layer, Option, Schedule } from "effect";
import { splitCsv } from "@vexed/shared/csv";
import { Bridge } from "../Services/Bridge";
import { Combat } from "../Services/Combat";
import type { CombatKillOptions, CombatShape } from "../Services/Combat";
import { Drops } from "../Services/Drops";
import { PacketDomain } from "../Services/PacketDomain";
import { Player } from "../Services/Player";
import { World } from "../Services/World";
import type { MonsterTargetInfo, PlayerTargetInfo } from "../Types";

const DEFAULT_SKILL_ROTATION: readonly Skill[] = [1, 2, 3, 4];
const DEFAULT_SKILL_DELAY_MS = 150;
const COUNTER_ATTACK_WAIT_MS = 50;

type ResolvedKillTarget =
  | {
      readonly kind: "monMapId";
      readonly monMapId: number;
    }
  | {
      readonly kind: "name";
      readonly name: string;
    };

type NormalizedKillOptions = {
  readonly killPriority: readonly ResolvedKillTarget[];
  readonly skillSet: readonly Skill[];
  readonly skillDelayMs: number;
  readonly skillWait: boolean;
};

type ResolvedAttackSelection =
  | {
      readonly kind: "attack";
      readonly monMapId: number;
    }
  | {
      readonly kind: "blocked";
      readonly monMapId: number;
    };

const INTEGER_TOKEN_PATTERN = /^\d+$/;

const normalizeMonsterName = (value: string) => value.trim().toLowerCase();

const matchesMonsterName = (left: string, right: string) => {
  const normalizedLeft = normalizeMonsterName(left);
  const normalizedRight = normalizeMonsterName(right);

  if (normalizedLeft === "*") {
    return true;
  }

  return normalizedRight.includes(normalizedLeft);
};

const isValidSkillIndex = (index: number): boolean =>
  Number.isInteger(index) && index >= 0 && index <= 5;

const toMonMapId = (target: MonsterIdentifierToken): number | undefined => {
  if (typeof target === "number") {
    return Number.isFinite(target) && target > 0
      ? Math.trunc(target)
      : undefined;
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

const toValidSkill = (value: Skill): Skill | undefined => {
  if (typeof value === "number") {
    return isValidSkillIndex(value) ? value : undefined;
  }

  const trimmed = value.trim();
  if (!INTEGER_TOKEN_PATTERN.test(trimmed)) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return isValidSkillIndex(parsed) ? parsed : undefined;
};

const parseSkillSet = (
  value: CombatKillOptions["skillSet"],
): readonly Skill[] => {
  if (value === undefined) {
    return DEFAULT_SKILL_ROTATION;
  }

  const normalized: Skill[] = [];

  if (typeof value === "string") {
    for (const token of splitCsv(value)) {
      const skill = toValidSkill(token);
      if (skill !== undefined) {
        normalized.push(skill);
      }
    }
  } else {
    for (const token of value) {
      if (typeof token === "string") {
        const parts = splitCsv(token);
        if (parts.length > 1) {
          for (const part of parts) {
            const skill = toValidSkill(part);
            if (skill !== undefined) {
              normalized.push(skill);
            }
          }
          continue;
        }
      }

      const skill = toValidSkill(token);
      if (skill !== undefined) {
        normalized.push(skill);
      }
    }
  }

  return normalized.length > 0 ? normalized : DEFAULT_SKILL_ROTATION;
};

const parseKillPriority = (
  value: CombatKillOptions["killPriority"],
): readonly ResolvedKillTarget[] => {
  if (value === undefined) {
    return [];
  }

  const tokens: MonsterIdentifierToken[] = [];

  if (typeof value === "string") {
    tokens.push(...splitCsv(value));
  } else {
    for (const token of value) {
      if (typeof token === "string") {
        const parts = splitCsv(token);
        if (parts.length > 1) {
          tokens.push(...parts);
          continue;
        }

        const trimmed = token.trim();
        if (trimmed !== "") {
          tokens.push(trimmed);
        }
        continue;
      }

      if (Number.isFinite(token) && token > 0) {
        tokens.push(Math.trunc(token));
      }
    }
  }

  const resolved: ResolvedKillTarget[] = [];
  for (const token of tokens) {
    const target = resolveKillTarget(token);
    if (target.kind === "name" && target.name === "") {
      continue;
    }

    resolved.push(target);
  }

  return resolved;
};

const normalizeKillOptions = (
  options?: CombatKillOptions,
): NormalizedKillOptions => {
  const parsedDelay =
    options?.skillDelay !== undefined && Number.isFinite(options.skillDelay)
      ? Math.max(0, Math.trunc(options.skillDelay))
      : DEFAULT_SKILL_DELAY_MS;

  return {
    killPriority: parseKillPriority(options?.killPriority),
    skillSet: parseSkillSet(options?.skillSet),
    skillDelayMs: parsedDelay,
    skillWait: options?.skillWait === true,
  };
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const drops = yield* Drops;
  const player = yield* Player;

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

  const counterAttackMonsters = new Set<number>();

  const maybePacketDomain = yield* Effect.serviceOption(PacketDomain);
  const packetDomain = Option.isSome(maybePacketDomain)
    ? maybePacketDomain.value
    : undefined;

  const getCurrentTargetMonMapId = () =>
    Effect.gen(function* () {
      const target = yield* bridge
        .call("combat.getTarget")
        .pipe(Effect.catch(() => Effect.succeed(null)));

      if (!target || target.type !== "monster") {
        return undefined;
      }

      const targetInfo = target as MonsterTargetInfo;
      return Number.isFinite(targetInfo.MonMapID)
        ? targetInfo.MonMapID
        : undefined;
    });

  if (packetDomain !== undefined) {
    const disposers: Array<() => void> = [];

    const disposeCounterStart = yield* packetDomain.on(
      "counterAttackStart",
      (event) =>
        Effect.gen(function* () {
          counterAttackMonsters.add(event.monMapId);

          const currentTargetMonMapId = yield* getCurrentTargetMonMapId();
          if (currentTargetMonMapId === event.monMapId) {
            yield* stopCombat;
          }
        }),
    );
    disposers.push(disposeCounterStart);

    const disposeCounterEnd = yield* packetDomain.on(
      "counterAttackEnd",
      (event) =>
        Effect.sync(() => {
          counterAttackMonsters.delete(event.monMapId);
        }),
    );
    disposers.push(disposeCounterEnd);

    const disposeMonsterDeath = yield* packetDomain.on(
      "monsterDeath",
      (event) =>
        Effect.sync(() => {
          counterAttackMonsters.delete(event.monMapId);
        }),
    );
    disposers.push(disposeMonsterDeath);

    const disposeJoinMap = yield* packetDomain.on("joinMap", () =>
      Effect.sync(() => {
        counterAttackMonsters.clear();
      }),
    );
    disposers.push(disposeJoinMap);

    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        for (const dispose of disposers) {
          dispose();
        }

        counterAttackMonsters.clear();
      }),
    );
  }

  const isCounterAttackActive = (monMapId: number): boolean =>
    counterAttackMonsters.has(monMapId);

  const attackMonster: CombatShape["attackMonster"] = (monster) =>
    Effect.gen(function* () {
      const resolved = resolveKillTarget(monster);
      if (resolved.kind === "monMapId") {
        return yield* bridge.call("combat.attackMonsterById", [
          resolved.monMapId,
        ]);
      }

      return yield* bridge.call("combat.attackMonster", [resolved.name]);
    });

  const cancelAutoAttack: CombatShape["cancelAutoAttack"] = () =>
    bridge.call("combat.cancelAutoAttack");

  const cancelTarget: CombatShape["cancelTarget"] = () =>
    bridge.call("combat.cancelTarget");

  const exit: CombatShape["exit"] = () =>
    Effect.gen(function* () {
      const maybeWorld = yield* Effect.serviceOption(World);
      if (Option.isNone(maybeWorld)) return false;

      const world = maybeWorld.value;

      const isInCombat = world.players
        .withSelf((me) => me.isInCombat())
        .pipe(Effect.map(Option.getOrElse(() => false)));

      const waitUntilFree = (timeoutMs = 3_000) =>
        isInCombat.pipe(
          Effect.map((inCombat) => !inCombat),
          Effect.repeat({
            schedule: Schedule.spaced("100 millis"),
            until: (outOfCombat) => outOfCombat,
          }),
          Effect.timeout(`${timeoutMs} millis`),
          Effect.option,
        );

      // Already free
      if (!(yield* isInCombat)) return true;

      try {
        const currentCell = yield* world.players
          .withSelf((me) => me.cell)
          .pipe(Effect.map((r) => (Option.isSome(r) ? r.value : "")));

        const currentPad = yield* world.players
          .withSelf((me) => me.pad)
          .pipe(Effect.map((r) => (Option.isSome(r) ? r.value : "")));

        const monsters = yield* world.monsters.getAll();
        const cellsWithMonsters = new Set(
          Array.from(monsters.values()).map((mon) => mon.cell.toLowerCase()),
        );

        yield* player.jumpToCell(currentCell, currentPad);
        yield* waitUntilFree(1_000);
        if (!(yield* isInCombat)) return true;

        const allCells = yield* world.map.getCells();
        const candidates = allCells
          .filter(
            (cell) =>
              cell !== currentCell &&
              cell.toLowerCase() !== "blank" &&
              cell.toLowerCase() !== "wait" &&
              !/^cut\d+$/i.test(cell),
          )
          .sort((a, b) => {
            const aHas = cellsWithMonsters.has(a.toLowerCase());
            const bHas = cellsWithMonsters.has(b.toLowerCase());
            return aHas === bHas ? 0 : aHas ? 1 : -1;
          });

        // Batch candidates by monster presence
        const safeCells = candidates.filter(
          (cell) => !cellsWithMonsters.has(cell.toLowerCase()),
        );
        const unsafeCells = candidates.filter((cell) =>
          cellsWithMonsters.has(cell.toLowerCase()),
        );

        for (const cell of [...safeCells, ...unsafeCells]) {
          if (!(yield* isInCombat)) return true;
          yield* player.jumpToCell(cell, undefined, true);
          if (Option.isSome(yield* waitUntilFree(2_000))) return true;
        }

        const MAX_ATTEMPTS = 3;
        let attempts = 0;
        let success = false;

        yield* Effect.whileLoop({
          while: () => attempts < MAX_ATTEMPTS && !success,
          body: () =>
            Effect.gen(function* () {
              if (!(yield* isInCombat)) {
                success = true;
                return;
              }
              yield* player.jumpToCell(currentCell, currentPad, true);
              if (Option.isSome(yield* waitUntilFree(2_000))) {
                success = true;
                return;
              }
              attempts++;
            }),
          step: () => {},
        });

        if (success) return true;

        return !(yield* isInCombat);
      } finally {
        yield* Effect.sleep("500 millis");
      }
    });

  const useSkill: CombatShape["useSkill"] = (
    index,
    force = false,
    wait = false,
  ) =>
    Effect.gen(function* () {
      const strIndex = String(index);
      const idx = Number.parseInt(strIndex, 10);
      if (!isValidSkillIndex(idx)) {
        return;
      }

      const targetBeforeWait = yield* getCurrentTargetMonMapId();
      if (
        targetBeforeWait !== undefined &&
        isCounterAttackActive(targetBeforeWait)
      ) {
        yield* stopCombat;
        return;
      }

      if (wait) {
        const duration = yield* bridge.call(
          "combat.getSkillCooldownRemaining",
          [idx],
        );
        yield* Effect.sleep(duration);
      }

      const targetBeforeCast = yield* getCurrentTargetMonMapId();
      if (
        targetBeforeCast !== undefined &&
        isCounterAttackActive(targetBeforeCast)
      ) {
        yield* stopCombat;
        return;
      }

      if (force) {
        yield* bridge.call("combat.forceUseSkill", [strIndex]);
        return;
      }

      yield* bridge.call("combat.useSkill", [strIndex]);
    });

  const canUseSkill: CombatShape["canUseSkill"] = (index) =>
    Effect.gen(function* () {
      const strIndex = String(index);
      const idx = Number.parseInt(strIndex, 10);
      if (!isValidSkillIndex(idx)) {
        return false;
      }

      const cooldown = yield* bridge.call("combat.getSkillCooldownRemaining", [
        idx,
      ]);
      return cooldown === 0;
    });

  const hasTarget: CombatShape["hasTarget"] = () =>
    bridge.call("combat.hasTarget");

  const getTarget: CombatShape["getTarget"] = () =>
    Effect.gen(function* () {
      const target = yield* bridge.call("combat.getTarget");
      if (!target) {
        return null;
      }

      const maybeWorld = yield* Effect.serviceOption(World);
      if (Option.isNone(maybeWorld)) {
        return null;
      }

      const world = maybeWorld.value;

      if (target.type === "monster") {
        const monsterTarget = target as MonsterTargetInfo;
        const monster = yield* world.monsters.get(monsterTarget.MonMapID);
        return Option.isSome(monster) ? monster.value : null;
      }

      const playerTarget = target as PlayerTargetInfo;
      const player = yield* world.players.get(playerTarget.strUsername);
      return Option.isSome(player) ? player.value : null;
    });

  const kill: CombatShape["kill"] = (target, options) => {
    let disposeMonsterDeathListener: (() => void) | undefined;
    const normalizedKillOptions = normalizeKillOptions(options);

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

      const attackOrder = [
        ...normalizedKillOptions.killPriority,
        resolvedTarget,
      ];

      const waitUntilPlayerAlive = () =>
        Effect.repeat(
          world.players.withSelf((me) => me.alive),
          {
            schedule: Schedule.spaced("250 millis"),
            until: (alive) => Option.isSome(alive) && alive.value,
          },
        ).pipe(Effect.asVoid);

      const getCurrentCell = () =>
        world.players
          .withSelf((me) => me.cell)
          .pipe(
            Effect.map((cell) =>
              Option.isSome(cell) ? cell.value : undefined,
            ),
          );

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

      const resolveAliveMonMapId = (
        candidate: ResolvedKillTarget,
        skipCounterAttack: boolean,
      ) =>
        Effect.gen(function* () {
          if (candidate.kind === "monMapId") {
            const maybeMonster = yield* world.monsters.get(candidate.monMapId);
            if (Option.isNone(maybeMonster)) {
              return undefined;
            }

            const monster = maybeMonster.value;
            if (!monster.alive || monster.isDead()) {
              return undefined;
            }

            if (
              skipCounterAttack &&
              isCounterAttackActive(candidate.monMapId)
            ) {
              return undefined;
            }

            return candidate.monMapId;
          }

          const meCell = yield* getCurrentCell();
          const normalizedCell = meCell?.toLowerCase();
          const monsters = yield* world.monsters.getAll();

          for (const [, monster] of monsters) {
            if (!monster.alive || monster.isDead()) {
              continue;
            }

            if (
              normalizedCell !== undefined &&
              monster.cell.toLowerCase() !== normalizedCell
            ) {
              continue;
            }

            if (!matchesMonsterName(candidate.name, monster.name)) {
              continue;
            }

            if (skipCounterAttack && isCounterAttackActive(monster.monMapId)) {
              continue;
            }

            return monster.monMapId;
          }

          return undefined;
        });

      const resolveNextAttack = () =>
        Effect.gen(function* () {
          let blockedMonMapId: number | undefined;
          const shouldCheckBlockedFallback = counterAttackMonsters.size > 0;

          for (const candidate of attackOrder) {
            const attackableMonMapId = yield* resolveAliveMonMapId(
              candidate,
              true,
            );
            if (attackableMonMapId !== undefined) {
              return {
                kind: "attack",
                monMapId: attackableMonMapId,
              } satisfies ResolvedAttackSelection;
            }

            if (!shouldCheckBlockedFallback) {
              continue;
            }

            const maybeBlockedMonMapId = yield* resolveAliveMonMapId(
              candidate,
              false,
            );
            if (
              maybeBlockedMonMapId !== undefined &&
              isCounterAttackActive(maybeBlockedMonMapId)
            ) {
              blockedMonMapId = maybeBlockedMonMapId;
              break;
            }
          }

          if (blockedMonMapId !== undefined) {
            return {
              kind: "blocked",
              monMapId: blockedMonMapId,
            } satisfies ResolvedAttackSelection;
          }

          return undefined;
        });

      let didKillTarget = false;
      let targetMonMapId =
        resolvedTarget.kind === "monMapId"
          ? resolvedTarget.monMapId
          : undefined;
      let skillIndex = 0;

      if (packetDomain !== undefined) {
        disposeMonsterDeathListener = yield* packetDomain.on(
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
          targetMonMapId = yield* resolveAliveMonMapId(resolvedTarget, false);
        }

        let attackedThisLoop = false;

        const nextAttack = yield* resolveNextAttack();
        if (nextAttack?.kind === "attack") {
          yield* attackMonster(nextAttack.monMapId);
          attackedThisLoop = true;

          const skill =
            normalizedKillOptions.skillSet[
              skillIndex % normalizedKillOptions.skillSet.length
            ];
          skillIndex += 1;

          if (skill !== undefined) {
            yield* useSkill(skill, false, normalizedKillOptions.skillWait);
          }
        } else if (nextAttack?.kind === "blocked") {
          yield* stopCombat;
        } else if (nextAttack === undefined) {
          return;
        }

        if (targetMonMapId !== undefined) {
          didKillTarget = yield* isMonsterDead(targetMonMapId);
        }

        if (!didKillTarget) {
          if (attackedThisLoop && normalizedKillOptions.skillDelayMs > 0) {
            yield* Effect.sleep(normalizedKillOptions.skillDelayMs);
          } else if (!attackedThisLoop) {
            yield* Effect.sleep(COUNTER_ATTACK_WAIT_MS);
          }
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
    options?: CombatKillOptions,
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

        yield* kill(target, options);
        yield* Effect.sleep("100 millis");
      }
    });

  const killForItem: CombatShape["killForItem"] = (
    target,
    item,
    quantity,
    options,
  ) => {
    const resolvedItem = resolveItemIdentifier(item);
    if (resolvedItem === undefined) {
      return Effect.void;
    }

    const normalizedQuantity = normalizeItemQuantity(quantity);

    return killUntil(
      target,
      () =>
        Effect.gen(function* () {
          const hasDrop = yield* drops.containsDrop(resolvedItem);
          if (hasDrop) {
            yield* drops.acceptDrop(resolvedItem);
          }
          return yield* containsInventoryItem(resolvedItem, normalizedQuantity);
        }),
      options,
    );
  };

  const killForTempItem: CombatShape["killForTempItem"] = (
    target,
    item,
    quantity,
    options,
  ) => {
    const resolvedItem = resolveItemIdentifier(item);
    if (resolvedItem === undefined) {
      return Effect.void;
    }

    const normalizedQuantity = normalizeItemQuantity(quantity);

    return killUntil(
      target,
      () => containsTempInventoryItem(resolvedItem, normalizedQuantity),
      options,
    );
  };

  const hunt: CombatShape["hunt"] = (target, findMost = false) =>
    Effect.gen(function* () {
      const resolvedTarget = resolveKillTarget(target);
      if (resolvedTarget.kind === "name" && resolvedTarget.name === "") {
        return "";
      }

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
        yield* player.jumpToCell(bestCell, undefined, true);
      }

      return bestCell;
    });

  return {
    attackMonster,
    cancelAutoAttack,
    cancelTarget,
    useSkill,
    canUseSkill,
    exit,
    getTarget,
    hasTarget,
    kill,
    killForItem,
    killForTempItem,
    hunt,
  } satisfies CombatShape;
});

export const CombatLive = Layer.effect(Combat, make);
