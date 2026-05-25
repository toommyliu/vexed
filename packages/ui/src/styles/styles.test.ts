import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesRoot = resolve(import.meta.dirname);

function readStyle(name: string): string {
  return readFileSync(resolve(stylesRoot, name), "utf8");
}

describe("Chrome 87 CSS compatibility", () => {
  it("does not use unsupported CSS syntax", () => {
    const css = [readStyle("tokens.css"), readStyle("components.css")].join(
      "\n",
    );
    const forbidden = [
      ":has(",
      ":where(",
      ":is(",
      "color-mix(",
      "oklch(",
      "lch(",
      "lab(",
      "--alpha(",
      "--theme(",
      "@layer",
      "@property",
      "accent-color",
      "&",
    ];

    for (const pattern of forbidden) {
      expect(css, pattern).not.toContain(pattern);
    }
  });
});
