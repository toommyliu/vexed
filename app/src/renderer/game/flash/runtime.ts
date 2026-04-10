import { Layer, ManagedRuntime } from "effect";
import { ScriptRunnerLive } from "../scripting/Layers/ScriptRunner";
import { FlashLive } from "./Layers/Flash";

const GameLive = Layer.mergeAll(
	FlashLive,
	ScriptRunnerLive.pipe(Layer.provide(FlashLive))
);

export const runtime = ManagedRuntime.make(GameLive);
