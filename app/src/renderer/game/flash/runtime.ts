import { ManagedRuntime } from "effect";
import { FlashLive } from "./Layers/Flash";

export const runtime = ManagedRuntime.make(FlashLive);
