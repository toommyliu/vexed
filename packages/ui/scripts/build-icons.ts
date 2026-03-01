import * as fs from "node:fs";
import * as path from "node:path";

const ICONS_DIR = path.join(
  import.meta.dirname,
  "../src/lib/components/core/icons",
);
const SVG_RAW_DIR = path.join(ICONS_DIR, "svg-raw");
const ICONS_OUTPUT_DIR = path.join(ICONS_DIR, "_icons");
const ICON_SVELTE_PATH = path.join(ICONS_DIR, "icon.svelte");
const ICONS_TS_PATH = path.join(ICONS_DIR, "icons.ts");

interface IconInfo {
  fileName: string;
  iconName: string;
  registryKey: string;
  importName: string;
  svgContent: string;
}

function sanitizeRegistryKey(name: string): string {
  return name
    .replace(/\d+/g, "") // Remove all numbers
    .replace(/-/g, "_") // Replace hyphens with underscores
    .replace(/_+$/, "") // Remove trailing underscores
    .replace(/^_+/, ""); // Remove leading underscores
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function extractSvgBody(svgContent: string): string {
  const svgMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!svgMatch) {
    throw new Error("Invalid SVG: Could not find <svg> element");
  }
  return svgMatch[1].trim();
}

function extractSvgAttributes(svgContent: string): Record<string, string> {
  const svgMatch = svgContent.match(/<svg([^>]*)>/i);
  if (!svgMatch) {
    return {};
  }

  const attrString = svgMatch[1];
  const attrs: Record<string, string> = {};

  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

function generateComponentContent(
  iconName: string,
  svgContent: string,
): string {
  const body = extractSvgBody(svgContent);
  const attrs = extractSvgAttributes(svgContent);

  const xmlns = attrs.xmlns || "http://www.w3.org/2000/svg";
  const viewBox = attrs.viewBox || "0 0 24 24";

  const defaultClass = `lucide lucide-${iconName}-icon lucide-${iconName}`;

  return `<script lang="ts">
  import { cn } from "$lib/utils";

  type Props = {
    class?: string;
  };

  let { class: className, ...restProps }: Props = $props();
</script>

<svg
  xmlns="${xmlns}"
  width="24"
  height="24"
  viewBox="${viewBox}"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={cn("${defaultClass}", className)}
  {...restProps}
>${body}</svg
>
`;
}

function generateIconsTs(icons: IconInfo[]): string {
  const sortedIcons = [...icons].sort((a, b) =>
    a.iconName.localeCompare(b.iconName),
  );

  const importLines = sortedIcons.map(
    (icon) =>
      `import ${icon.importName} from "./_icons/${icon.iconName}.svelte";`,
  );

  const registryLines = sortedIcons.map(
    (icon) => `  ${icon.registryKey}: ${icon.importName},`,
  );

  return `${importLines.join("\n")}

export const icons = {
${registryLines.join("\n")}
} as const;

export type IconName = keyof typeof icons;
`;
}

function generateIconSvelte(): string {
  return `<script lang="ts">
  import { icons, type IconName } from "./icons.js";

  import type { Component as SvelteComponent } from "svelte";
  import { cn } from "$lib/utils";

  type Color =
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "notice"
    | "warning"
    | "danger";

  type Size = "2xs" | "xs" | "sm" | "md" | "lg" | "xl";

  interface Props {
    icon: IconName;
    class?: string;
    style?: string;
    size?: Size;
    spin?: boolean;
    title?: string;
    color?: Color | "custom" | "default";
  }

  let {
    icon,
    color = "default",
    spin = false,
    size = "md",
    style,
    class: className,
    title,
  }: Props = $props();

  const Component = $derived(
    (icons[icon] ?? icons.triangle_alert) as SvelteComponent<{
      title?: string;
      style?: string;
      class?: string;
    }>,
  );

  const sizeClass = $derived(
    {
      xl: "h-6 w-6",
      lg: "h-5 w-5",
      md: "h-4 w-4",
      sm: "h-3.5 w-3.5",
      xs: "h-3 w-3",
      "2xs": "h-2.5 w-2.5",
    }[size],
  );

  const colorClass = $derived(
    color === "primary"
      ? "text-primary"
      : color === "secondary"
        ? "text-secondary"
        : color === "info"
          ? "text-info"
          : color === "success"
            ? "text-success"
            : color === "notice"
              ? "text-notice"
              : color === "warning"
                ? "text-warning"
                : color === "danger"
                  ? "text-danger"
                  : "",
  );
</script>

<Component
  {title}
  {style}
  class={cn(
    "shrink-0",
    spin ? "animate-spin" : "transform-gpu",
    sizeClass,
    colorClass,
    className,
  )}
/>
`;
}

async function main() {
  console.log("Building icons...\n");

  if (!fs.existsSync(SVG_RAW_DIR)) {
    console.error(`Error: svg-raw directory not found at ${SVG_RAW_DIR}`);
    process.exit(1);
  }

  const svgFiles = fs
    .readdirSync(SVG_RAW_DIR)
    .filter((f) => f.endsWith(".svg"));

  if (svgFiles.length === 0) {
    console.log("No SVG files found in svg-raw/");
    return;
  }

  if (!fs.existsSync(ICONS_OUTPUT_DIR)) {
    fs.mkdirSync(ICONS_OUTPUT_DIR, { recursive: true });
  }

  const newIcons: IconInfo[] = [];

  for (const svgFile of svgFiles) {
    const fileName = svgFile.replace(".svg", "");
    const iconName = fileName;
    const registryKey = sanitizeRegistryKey(fileName);
    const importName = "Icon" + toPascalCase(fileName);
    const svgPath = path.join(SVG_RAW_DIR, svgFile);

    console.log(`Processing: ${svgFile}`);

    try {
      const svgContent = fs.readFileSync(svgPath, "utf-8");
      const componentContent = generateComponentContent(iconName, svgContent);

      const outputPath = path.join(ICONS_OUTPUT_DIR, `${iconName}.svelte`);
      fs.writeFileSync(outputPath, componentContent);

      newIcons.push({
        fileName,
        iconName,
        registryKey,
        importName,
        svgContent,
      });

      console.log(`  → Generated: _icons/${iconName}.svelte`);
    } catch (error) {
      console.error(`  ✗ Error processing ${svgFile}:`, error);
    }
  }

  if (newIcons.length > 0) {
    console.log("\nGenerating icons.ts...");
    const iconsTsContent = generateIconsTs(newIcons);
    fs.writeFileSync(ICONS_TS_PATH, iconsTsContent);
    console.log(`  → Generated icons.ts with ${newIcons.length} icons`);

    console.log("\nUpdating icon.svelte...");
    const iconSvelteContent = generateIconSvelte();
    fs.writeFileSync(ICON_SVELTE_PATH, iconSvelteContent);
    console.log(`  → Updated icon.svelte`);
  }

  console.log(`\n✓ Done! Generated ${newIcons.length} icons.`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
