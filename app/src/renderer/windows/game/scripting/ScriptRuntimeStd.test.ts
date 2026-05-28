import { describe, expect, it } from "vitest";
import { ScriptExecutionError } from "./Errors";
import { makeScriptRuntimeStd } from "./ScriptRuntimeStd";
import type { ScriptContext } from "./ScriptApi";

const makeContext = (): ScriptContext => {
  const api = {
    combat: {
      useSkill: (skill: number) => `skill:${skill}`,
    },
    wait: {
      forSkillReady: (skill: number) => `ready:${skill}`,
      forMapLoaded: (map: string) => `map:${map}`,
      until: () => "until",
    },
  };
  const features = {
    autoZone: {
      enable: () => "zone:enabled",
    },
    autoRelogin: {
      enable: () => "relogin:enabled",
    },
    antiCounter: {
      enable: () => "counter:enabled",
    },
  };

  return {
    api,
    script: {
      signal: new AbortController().signal,
      options: {},
      log: (message: string) => `log:${message}`,
      stop: () => "stop",
      sleep: (ms: number) => `sleep:${ms}`,
      exit: (_options?: unknown) => "exit",
    },
    features,
  } as unknown as ScriptContext;
};

describe("script runtime std", () => {
  it("supports top-level destructuring before context binding", () => {
    const runtime = makeScriptRuntimeStd("runtime.test.js");
    expect(Object.keys(runtime.module)).toEqual(["api", "script", "features"]);

    const { features, script, api } = runtime.module;
    const { autoZone } = features;
    const useSkill = api.combat.useSkill;

    runtime.setContext(makeContext());

    expect(api.wait.forSkillReady(5)).toBe("ready:5");
    expect(api.wait.forMapLoaded("battleon")).toBe("map:battleon");
    expect(useSkill(1)).toBe("skill:1");
    expect(script.log("ready")).toBe("log:ready");
    expect(script.exit()).toBe("exit");
    expect(autoZone.enable()).toBe("zone:enabled");
    expect(api.wait.until(() => true)).toBe("until");
  });

  it("fails clearly before context binding", () => {
    const runtime = makeScriptRuntimeStd("runtime.test.js");
    const { api } = runtime.module;

    expect(() => api.wait.forSkillReady(5)).toThrow(ScriptExecutionError);
    expect(() => api.wait.forSkillReady(5)).toThrow(
      'require("vexed").api.wait',
    );
  });

  it("clears context instead of reusing stale values", () => {
    const runtime = makeScriptRuntimeStd("runtime.test.js");
    const { api } = runtime.module;
    const useSkill = api.combat.useSkill;

    runtime.setContext(makeContext());
    expect(useSkill(2)).toBe("skill:2");

    runtime.clearContext();

    expect(() => useSkill(2)).toThrow(ScriptExecutionError);
    expect(() => useSkill(2)).toThrow('require("vexed").api.combat.useSkill');
  });
});
