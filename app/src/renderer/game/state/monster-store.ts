import { Collection } from "@vexed/collection";
import { Monster, type MonsterData } from "@vexed/game";

export class MonsterStore extends Collection<number /* monMapId */, Monster> {
  public add(mon: MonsterData): void {
    this.set(mon.monMapId, new Monster(mon));
  }

  public update(monMapId: number, data: Partial<MonsterData>): void {
    const mon = this.get(monMapId);
    if (mon) {
      Object.assign(mon.data, data);
    }
  }
}
