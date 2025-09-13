import { Command } from "@botting/command";
import type { MonsterData } from "@lib/models/Monster";
import { extractMonsterMapId, isMonsterMapId } from "@utils/isMonMapId";

export class CommandHunt extends Command {
  public target!: string;

  public most?: boolean = false;

  public override async execute() {
    const matchingMonsters = this.filterMonstersByTarget(
      this.bot.world.monsters,
      this.target,
    );

    if (matchingMonsters.length === 0) return;

    const monstersByCell = this.groupMonstersByCell(matchingMonsters);
    const targetCell = this.findBestCell(monstersByCell);

    if (!targetCell) return;

    await this.bot.world.jump(targetCell);

    const cellPad =
      this.bot.world.cellPads[
        Math.floor(Math.random() * this.bot.world.cellPads.length)
      ];
    await this.bot.world.jump(targetCell, cellPad, true);
  }

  // Get all monsters that match the target
  private filterMonstersByTarget(
    monsters: MonsterData[],
    target: string,
  ): MonsterData[] {
    if (isMonsterMapId(target)) {
      const monMapIdStr = extractMonsterMapId(target);
      const monMapId = Number.parseInt(monMapIdStr, 10);
      return monsters.filter((monster) => monster.MonMapID === monMapId);
    }

    if (target === "*") return monsters;

    return monsters.filter((monster) =>
      monster.strMonName.toLowerCase().includes(target.toLowerCase()),
    );
  }

  // Group monsters by their cell
  private groupMonstersByCell(
    monsters: MonsterData[],
  ): Map<string, MonsterData[]> {
    const groups = new Map<string, MonsterData[]>();

    for (const monster of monsters) {
      const cell = monster.strFrame;
      if (!groups.has(cell)) groups.set(cell, []);

      groups.get(cell)!.push(monster);
    }

    return groups;
  }

  // Find the best cell to jump to based on the 'most' option
  private findBestCell(
    monstersByCell: Map<string, MonsterData[]>,
  ): string | null {
    const cells = Array.from(monstersByCell.keys());

    if (cells.length === 0) return null;

    if (!this.most) return cells[0] ?? null;

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

  public override toString() {
    return `Jump to monster: ${this.target}${this.most ? " [most]" : ""}`;
  }
}
