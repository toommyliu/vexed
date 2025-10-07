import { Collection } from "@vexed/collection";
import type { Avatar } from "../models/Avatar";

export class PlayerCollection extends Collection<
  string /* playerName */,
  Avatar
> {}
