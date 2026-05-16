import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ScriptLoadError } from "./Errors";
import { loadScriptModule } from "./scriptLoader";

describe("script loader", () => {
  it("loads a CommonJS generator export", async () => {
    const main = await Effect.runPromise(
      loadScriptModule(
        `
module.exports = function* run({ script }) {
  script.log("ready")
}
`,
        "loader.test.js",
      ),
    );

    expect(main.constructor.name).toBe("GeneratorFunction");
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
