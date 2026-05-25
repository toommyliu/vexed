import * as DurationModule from "effect/Duration";
import * as EffectModule from "effect/Effect";
import { pipe } from "effect/Function";
import * as OptionModule from "effect/Option";

export interface ScriptEffectStd {
  readonly Effect: typeof EffectModule;
  readonly Option: typeof OptionModule;
  readonly Duration: typeof DurationModule;
  readonly pipe: typeof pipe;
}

const freezeModuleFacade = <Module extends object>(module: Module): Module =>
  Object.freeze({ ...module }) as Module;

export const scriptEffectStd: ScriptEffectStd = Object.freeze({
  Effect: freezeModuleFacade(EffectModule),
  Option: freezeModuleFacade(OptionModule),
  Duration: freezeModuleFacade(DurationModule),
  pipe,
});
