import { describe, expect, it } from "vitest";
import { createDebugScriptSource } from "./debugEval";

describe("debug eval", () => {
  it("wraps snippets with the script runtime import", () => {
    const source = `const cell = yield* api.player.getCell();
script.log(\`Cell: \${cell}\`);`;

    const wrapped = createDebugScriptSource(source);

    expect(wrapped).toContain(
      'const { api, script, features } = require("vexed");',
    );
    expect(wrapped).toContain("module.exports = function* debug()");
    expect(wrapped).toContain(source);
  });

  it("keeps full CommonJS scripts unchanged", () => {
    const source = `module.exports = function* run() {
  script.log("ready");
};`;

    expect(createDebugScriptSource(source)).toBe(source);
  });
});
