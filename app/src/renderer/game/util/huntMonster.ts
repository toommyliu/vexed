import type { Bot } from "~/lib/Bot";
import type { MonsterData } from "~/lib/models/Monster";
import { includesIgnoreCase } from "~/shared/string";
import { extractMonsterMapId, isMonsterMapId } from "~/utils/isMonMapId";

export type HuntOptions = {
    /**
     * Whether to choose the cell with the most monsters
     */
    most?: boolean | undefined;
};

/**
 * Hunts for a monster by finding the best cell and jumping to it.
 *
 * @param bot - The bot instance
 * @param target - The monster name, monMapID, or "*" for any
 * @param options - Hunt options
 * @returns The cell that was jumped to, or null if no monster found
 */
export async function huntMonster(
    bot: Bot,
    target: string,
    options: HuntOptions = {},
): Promise<string | null> {
    const matchingMonsters = filterMonstersByTarget(bot.world.monsters, target);
    if (matchingMonsters.length === 0) return null;

    const monstersByCell = groupMonstersByCell(matchingMonsters);
    const targetCell = findBestCell(monstersByCell, options.most ?? false);

    if (!targetCell) return null;

    await bot.world.jump(targetCell);

    const cellPad =
        bot.world.cellPads[Math.floor(Math.random() * bot.world.cellPads.length)];
    await bot.world.jump(targetCell, cellPad, true);

    return targetCell;
}

/**
 * Get all monsters that match the target
 */
function filterMonstersByTarget(
    monsters: MonsterData[],
    target: string,
): MonsterData[] {
    if (isMonsterMapId(target)) {
        const monMapIdStr = extractMonsterMapId(target);
        const monMapId = Number.parseInt(monMapIdStr, 10);
        return monsters.filter((mon) => mon.MonMapID === monMapId);
    }

    if (target === "*") return monsters;

    return monsters.filter((mon) => includesIgnoreCase(mon.strMonName, target));
}

/**
 * Group monsters by their cell
 */
function groupMonstersByCell(
    monsters: MonsterData[],
): Map<string, MonsterData[]> {
    const groups = new Map<string, MonsterData[]>();

    for (const mon of monsters) {
        const cell = mon.strFrame;
        if (!groups.has(cell)) groups.set(cell, []);
        groups.get(cell)!.push(mon);
    }

    return groups;
}

/**
 * Find the best cell to jump to based on the 'most' option
 */
function findBestCell(
    monstersByCell: Map<string, MonsterData[]>,
    most: boolean,
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
