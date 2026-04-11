import { ManagedRuntime, Effect } from "effect";
import { FlashLive } from "./Layers/Flash";

export const runtime = ManagedRuntime.make(FlashLive);

runtime.runFork(Effect.void);