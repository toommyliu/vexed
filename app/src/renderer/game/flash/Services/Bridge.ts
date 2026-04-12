import { ServiceMap } from "effect";
import type { Effect } from "effect";
import {
  SwfCallError,
  SwfMethodNotFoundError,
  SwfUnavailableError,
} from "../Errors";

export type BridgeError =
  | SwfUnavailableError
  | SwfMethodNotFoundError
  | SwfCallError;

export type BridgeEffect<A> = Effect.Effect<A, BridgeError>;

export type BridgeEventDisposer = () => void;

export interface BridgeShape {
  call<K extends keyof Window["swf"]>(
    path: K,
    args?: Parameters<Window["swf"][K]>,
  ): Effect.Effect<ReturnType<Window["swf"][K]>, BridgeError>;
  onConnection(
    handler: (status: ConnectionStatus) => void,
  ): Effect.Effect<BridgeEventDisposer>;
}

export class Bridge extends ServiceMap.Service<Bridge, BridgeShape>()(
  "flash/Services/Bridge",
) {}
