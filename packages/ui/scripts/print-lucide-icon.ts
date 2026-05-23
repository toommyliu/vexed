const lucideVersion = "1.14.0";
const supportedElementNames = new Set([
  "circle",
  "line",
  "path",
  "polyline",
  "rect",
]);

function toIconKey(name: string): string {
  return name.trim().toLowerCase().replace(/-/g, "_");
}

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrPattern = /([a-zA-Z][\w:-]*)="([^"]*)"/g;

  for (const match of source.matchAll(attrPattern)) {
    const [, name, value] = match;
    if (name === undefined || value === undefined) continue;
    attrs[name] = value;
  }

  return attrs;
}

function formatAttrs(attrs: Record<string, string>): string {
  const entries = Object.entries(attrs);
  if (entries.length === 0) return "{}";

  return `{ ${entries
    .map(([name, value]) => `${JSON.stringify(name)}: ${JSON.stringify(value)}`)
    .join(", ")} }`;
}

function parseIconNodes(svg: string): string {
  const nodePattern = /<(circle|line|path|polyline|rect)\b([^>]*)\/?>/g;
  const nodes: string[] = [];

  for (const match of svg.matchAll(nodePattern)) {
    const [, elementName, attrSource] = match;
    if (
      elementName === undefined ||
      attrSource === undefined ||
      !supportedElementNames.has(elementName)
    ) {
      continue;
    }

    nodes.push(
      `    [${JSON.stringify(elementName)}, ${formatAttrs(parseAttributes(attrSource))}],`,
    );
  }

  if (nodes.length === 0) {
    throw new Error("No supported SVG child nodes found.");
  }

  return nodes.join("\n");
}

async function fetchIconSvg(name: string): Promise<string> {
  const response = await fetch(
    `https://unpkg.com/lucide-static@${lucideVersion}/icons/${name}.svg`,
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${name}.svg from Lucide ${lucideVersion}: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

async function main(): Promise<void> {
  const iconNames = process.argv.slice(2);
  if (iconNames.length === 0) {
    throw new Error(
      "Usage: pnpm --dir packages/ui icon:print <lucide-icon-name> [...names]",
    );
  }

  for (const name of iconNames) {
    const svg = await fetchIconSvg(name);
    console.log(`  ${toIconKey(name)}: [`);
    console.log(parseIconNodes(svg));
    console.log("  ],");
  }
}

await main();

export {};
