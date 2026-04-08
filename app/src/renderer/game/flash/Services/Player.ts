import { ServiceMap } from "effect";
import type { Effect } from "effect";

export interface PlayerShape {
  isLoggedIn(): Effect.Effect<boolean>;
  useSkill(skillId: string): Effect.Effect<void>;
}

export class Player extends ServiceMap.Service<
  Player,
  PlayerShape
>()("flash/Services/Player") {}
