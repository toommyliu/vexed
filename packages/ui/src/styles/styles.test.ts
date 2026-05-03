import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesRoot = resolve(import.meta.dirname);
const packageRoot = resolve(stylesRoot, "../..");

function readStyle(name: string): string {
  return readFileSync(resolve(stylesRoot, name), "utf8");
}

function readPackageFile(path: string): string {
  return readFileSync(resolve(packageRoot, path), "utf8");
}

describe("CSS color tokens", () => {
  it("defines Chrome 87-compatible neutral primary and semantic tokens", () => {
    const tokens = readStyle("tokens.css");

    expect(tokens).toContain("--primary: 38, 38, 38;");
    expect(tokens).toContain("--destructive: 239, 68, 68;");
    expect(tokens).toContain("--info: 59, 130, 246;");
    expect(tokens).toContain("--success: 16, 185, 129;");
    expect(tokens).toContain("--warning: 245, 158, 11;");
    expect(tokens).not.toContain("-rgb:");
  });

  it("supports dark mode by class and data attribute", () => {
    const tokens = readStyle("tokens.css");

    expect(tokens).toContain(".dark,\n[data-theme=\"dark\"]");
    expect(tokens).toContain("color-scheme: dark;");
    expect(tokens).toContain("--primary: 245, 245, 245;");
    expect(tokens).toContain("--destructive: 248, 113, 113;");
  });

  it("defines semantic scrollbar tokens", () => {
    const tokens = readStyle("tokens.css");

    expect(tokens).toContain("--scrollbar-track:");
    expect(tokens).toContain("--scrollbar-thumb:");
    expect(tokens).toContain("--scrollbar-thumb-hover:");
    expect(tokens).toContain("--scrollbar-thumb-active:");
    expect(tokens).toContain("--color-scrollbar-thumb:");
  });
});

describe("component color usage", () => {
  it("uses comma-separated canonical tokens inside rgba()", () => {
    const components = readStyle("components.css");

    expect(components).toContain("rgba(var(--primary),");
    expect(components).toContain("rgba(var(--destructive),");
    expect(components).toContain("rgba(var(--ring),");
    expect(components).not.toContain("-rgb");
  });

  it("defines component BEM modifiers", () => {
    const components = readStyle("components.css");

    expect(components).toContain(".button--default");
    expect(components).toContain(".button--destructive-outline");
    expect(components).toContain(".button--icon-xs");
    expect(components).toContain(".button--xl");
    expect(components).toContain(".badge--info");
    expect(components).toContain(".badge--error");
    expect(components).toContain(".badge--outline");
    expect(components).toContain(".card-frame");
    expect(components).toContain(".card__action");
    expect(components).toContain(".card__panel");
    expect(components).toContain(".checkbox--disabled");
    expect(components).toContain(".alert--warning");
    expect(components).toContain(".dialog__content");
    expect(components).toContain(".select__trigger");
    expect(components).toContain(".combobox__control");
    expect(components).toContain(".command__item");
    expect(components).toContain(".empty__media");
    expect(components).toContain(".textarea-control--invalid");
  });

  it("does not translate filled buttons on active press", () => {
    const components = readStyle("components.css");

    expect(components).not.toContain("transform: translateY(1px)");
  });

  it("styles scrollbars with theme tokens and accessible fallbacks", () => {
    const components = readStyle("components.css");

    expect(components).toContain("scrollbar-color: rgb(var(--scrollbar-thumb))");
    expect(components).toContain("html::-webkit-scrollbar");
    expect(components).toContain("*::-webkit-scrollbar-thumb");
    expect(components).toContain("background-color: rgb(var(--scrollbar-thumb))");
    expect(components).toContain("@media (forced-colors: active)");
    expect(components).toContain("scrollbar-color: auto;");
  });

  it("does not use forbidden Chrome 87-incompatible CSS syntax", () => {
    const css = [readStyle("tokens.css"), readStyle("components.css")].join("\n");
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

  it("does not style components through data-slot selectors", () => {
    const components = readStyle("components.css");

    expect(components).not.toContain("[data-slot");
  });
});

describe("demo API usage", () => {
  it("uses compact defaults and shared API names", () => {
    const demo = [
      readPackageFile("demo/App.tsx"),
      readPackageFile("demo/demo.css"),
    ].join("\n");

    expect(demo).not.toContain("demo-shell--compact");
    expect(demo).not.toContain("variant=\"primary\"");
    expect(demo).not.toContain("size=\"md\"");
    expect(demo).toContain("variant=\"destructive-outline\"");
    expect(demo).toContain("size=\"xl\"");
    expect(demo).toContain("<AlertDialog");
    expect(demo).toContain("<Combobox");
    expect(demo).toContain("<Command");
    expect(demo).toContain("<Empty");
  });

  it("builds the demo for the Electron v11 Chrome 87 runtime", () => {
    const viteConfig = readPackageFile("vite.demo.config.ts");

    expect(viteConfig).toContain("target: \"chrome87\"");
    expect(viteConfig).toContain("esbuild:");
    expect(viteConfig).toContain("optimizeDeps:");
  });

  it("uses Vite for live demo previews", () => {
    const packageJson = readPackageFile("package.json");

    expect(packageJson).toContain("\"demo\": \"vite --config vite.demo.config.ts");
    expect(packageJson).toContain(
      "\"demo:build\": \"vite build --config vite.demo.config.ts\"",
    );
    expect(packageJson).toContain(
      "\"demo:electron11\": \"pnpm --dir ../../app dev:ui:electron11\"",
    );
  });
});
