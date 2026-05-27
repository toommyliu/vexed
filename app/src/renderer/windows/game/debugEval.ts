export const DEBUG_EVAL_SOURCE_NAME = "debug-eval.js";

export const createDebugScriptSource = (source: string): string =>
  source.includes("module.exports")
    ? source
    : `const { api, script, features } = require("vexed");

module.exports = function* debug() {
${source}
};`;
