import { Collection } from '@vexed/collection';
import { Monster } from '~/lib/models/Monster';
import type { MonsterData } from '~/lib/models/Monster';

export class MonsterStore extends Collection<number, Monster> {
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
