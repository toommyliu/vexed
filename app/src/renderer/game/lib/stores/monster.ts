import { Collection } from "@vexed/collection";
import { Monster, type MonsterData } from "@vexed/game";

export class MonsterStore extends Collection<number /* monMapId */, Monster> {
  public add(mon: MonsterData): void {
    this.set(mon.monMapId, new Monster(mon));
  }
}
