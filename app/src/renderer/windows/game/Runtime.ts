import { Layer, ManagedRuntime } from "effect";
import { ArmyLive } from "./army/Layers/Army";
import { FeaturesLive } from "./features/Layers/Features";
import { FlashLive } from "./flash/Layers/Flash";
import { FlashJobGateLive } from "./flash/Layers/JobGate";
import { FlashJobPoliciesLive } from "./flash/Layers/JobPolicies";
import { JobsLive } from "./jobs/Layers/Jobs";
import { ScriptRunnerLive } from "./scripting/Layers/ScriptRunner";

const FlashRuntimeLive = FlashLive;

const JobGateRuntimeLive = FlashJobGateLive.pipe(
  Layer.provide(FlashRuntimeLive),
);

const JobsRuntimeLive = JobsLive.pipe(
  Layer.provide(JobGateRuntimeLive),
);

const FlashJobPoliciesRuntimeLive = FlashJobPoliciesLive.pipe(
  Layer.provide(Layer.mergeAll(FlashRuntimeLive, JobsRuntimeLive)),
);

const FeatureRuntimeLive = FeaturesLive.pipe(
  Layer.provide(Layer.mergeAll(FlashRuntimeLive, JobsRuntimeLive)),
);

const ArmyRuntimeLive = ArmyLive.pipe(
  Layer.provide(FlashRuntimeLive),
);

const GameServicesLive = Layer.mergeAll(
  FlashRuntimeLive,
  JobsRuntimeLive,
  FlashJobPoliciesRuntimeLive,
  FeatureRuntimeLive,
  ArmyRuntimeLive,
);

const ScriptRunnerRuntimeLive = ScriptRunnerLive.pipe(
  Layer.provide(GameServicesLive),
);

const GameLive = Layer.mergeAll(
  GameServicesLive,
  ScriptRunnerRuntimeLive,
);

export const runtime = ManagedRuntime.make(GameLive);
