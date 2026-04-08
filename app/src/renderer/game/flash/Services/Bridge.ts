import { ServiceMap } from "effect";
import type { Effect } from "effect";

export interface BridgeShape {
  call<K extends keyof Window["swf"]>(
    path: K,
    args?: Parameters<Window["swf"][K]>
  ): Effect.Effect<ReturnType<Window["swf"][K]>>;
}

export class Bridge extends ServiceMap.Service<
  Bridge,
  BridgeShape
>()("flash/Services/Bridge") {}