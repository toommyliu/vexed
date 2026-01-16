import type { Monster } from "@vexed/game";
import type { MonsterStore } from "~/state/monster-store";
import { extractMonsterMapId, isMonsterMapId } from "~/utils/isMonMapId";

export function filterMonstersByTarget(
  monsters: MonsterStore,
  target: string,
): Monster[] {
  if (isMonsterMapId(target)) {
    const monMapIdStr = extractMonsterMapId(target);
    const monMapId = Number.parseInt(monMapIdStr, 10);
    return monsters
      .filter((monster) => monster.monMapId === monMapId)
      .map((mon) => mon);
  }

  if (target === "*") return [...monsters.values()];

  return monsters
    .filter((monster) =>
      monster.name.toLowerCase().includes(target.toLowerCase()),
    )
    .map((mon) => mon);
}

export function groupMonstersByCell(
  monsters: Monster[],
): Map<string, Monster[]> {
  const groups = new Map<string, Monster[]>();

  for (const monster of monsters) {
    const cell = monster.cell;
    if (!groups.has(cell)) groups.set(cell, []);

    groups.get(cell)!.push(monster);
  }

  return groups;
}

export function findBestCell(
  monstersByCell: Map<string, Monster[]>,
  most: boolean = false,
): string | null {
  const cells = Array.from(monstersByCell.keys());

  if (cells.length === 0) return null;

  if (!most) return cells[0] ?? null;

  let bestCell = cells[0];
  if (!bestCell) return null;

  let maxCount = monstersByCell.get(bestCell)?.length ?? 0;

  for (const cell of cells) {
    const count = monstersByCell.get(cell)?.length ?? 0;
    if (count > maxCount) {
      maxCount = count;
      bestCell = cell;
    }
  }

  return bestCell ?? null;
}
