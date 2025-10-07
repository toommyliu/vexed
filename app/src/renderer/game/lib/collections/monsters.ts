import { Collection } from "@vexed/collection";
import type { Monster } from "../models/Monster";

export class MonsterCollection extends Collection<
  number /* monMapID */,
  Monster
> {}
