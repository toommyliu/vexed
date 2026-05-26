import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ScriptLoadError } from "./Errors";
import { loadScriptModule } from "./scriptLoader";

describe("script loader", () => {
  it("loads a CommonJS generator export", async () => {
    const loaded = await Effect.runPromise(
      loadScriptModule(
        `
const { features, script, api } = require("vexed")

module.exports = function* run() {
  script.log("ready")
}
`,
        "loader.test.js",
      ),
    );

    expect(loaded.main.constructor.name).toBe("GeneratorFunction");
  });

  it("loads the vexed runtime import during module evaluation", async () => {
    const loaded = await Effect.runPromise(
      loadScriptModule(
        `
const { features, script, api } = require("vexed")
const useSkill = api.combat.useSkill

module.exports = function* run() {
  script.log(String(Boolean(api.wait.forSkillReady)))
  yield* useSkill(1)
}
`,
        "vexed-import.test.js",
      ),
    );

    expect(loaded.main.constructor.name).toBe("GeneratorFunction");
  });

  it("rejects missing exports", async () => {
    await expect(
      Effect.runPromise(loadScriptModule("const x = 1", "missing.test.js")),
    ).rejects.toBeInstanceOf(ScriptLoadError);
  });

  it("rejects async exports", async () => {
    await expect(
      Effect.runPromise(
        loadScriptModule(
          "module.exports = async function run() {}",
          "async.test.js",
        ),
      ),
    ).rejects.toBeInstanceOf(ScriptLoadError);
  });
});
