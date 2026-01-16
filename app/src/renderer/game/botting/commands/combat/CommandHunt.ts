import { Command } from "~/botting/command";
import {
  findBestCell,
  filterMonstersByTarget,
  groupMonstersByCell,
} from "~/lib/util/hunt-monster";

export class CommandHunt extends Command {
  public target!: string;

  public most?: boolean = false;

  public override async executeImpl() {
    const matchingMonsters = filterMonstersByTarget(
      this.bot.world.monsters,
      this.target,
    );

    if (matchingMonsters.length === 0) return;

    const monstersByCell = groupMonstersByCell(matchingMonsters);
    const targetCell = findBestCell(monstersByCell, this.most);

    if (!targetCell) {
      this.logger.debug(`No target cell found for: ${this.target}`);
      return;
    }

    this.logger.debug(
      `Best cell found for "${this.target}": ${targetCell} [${monstersByCell.get(targetCell)?.length}x]`,
    );

    await this.bot.world.jump(targetCell);

    const cellPad =
      this.bot.world.cellPads[
        Math.floor(Math.random() * this.bot.world.cellPads.length)
      ];
    await this.bot.world.jump(targetCell, cellPad, true);
  }

  public override toString() {
    return `Hunt: ${this.target}${this.most ? " [most]" : ""}`;
  }
}
