import { ManagedRuntime, Effect } from "effect";
import { FlashLive } from "./Layers/Flash";

export const runtime = ManagedRuntime.make(FlashLive);

// Kick off layer construction immediately
runtime.runFork(Effect.void);