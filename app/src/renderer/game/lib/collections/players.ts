import { Collection } from "@vexed/collection";
import type { Avatar } from "../models/Avatar";

export class PlayerCollection extends Collection<
  string /* playerName */,
  Avatar
> {
  public override get(key: string): Avatar | undefined {
    return super.get(key.toLowerCase());
  }

  public override has(key: string): boolean {
    return super.has(key.toLowerCase());
  }

  public override set(key: string, value: Avatar): this {
    return super.set(key.toLowerCase(), value);
  }

  public override delete(key: string): boolean {
    return super.delete(key.toLowerCase());
  }
}
