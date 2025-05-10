import { dirname, join } from "node:path";
import { totalist } from "totalist";
import * as typedoc from "typedoc";
import fs from "node:fs/promises";

const logger = new typedoc.ConsoleLogger();

// Legacy api path
const apiEntryPath = join(process.cwd(), "src/renderer/game/lib/");

// Legacy api docs path
const docsEntryPath = join(process.cwd(), "docs/src/content/docs/api-legacy/");

// The set of typescript files to parse
const files = new Set<string>();

// Class name: methods
const excludedMethods: Record<string, string[]> = {
  Bot: [
    "addListener",
    "emit",
    "eventNames",
    "getMaxListeners",
    "listenerCount",
    "listeners",
    "off",
    "on",
    "once",
    "prependListener",
    "prependOnceListener",
    "rawListeners",
    "removeAllListeners",
    "removeListener",
    "setMaxListeners",
  ],
};

/**
 * Converts a summary block to a description string.
 */
function makeDescription(summary: typedoc.CommentDisplayPart[]) {
  return summary.reduce((acc, part) => {
    if (part.kind === "text" || part.kind === "code") {
      return acc + part.text;
    }

    return "";
  }, "");
}

/**
 * Converts a block tag to a string.
 */
function makeBlockTag(tag: typedoc.CommentTag[]) {
  return tag.reduce((acc, part) => {
    if (part.tag === "@example") {
      return acc + part.content.map((p) => p.text).join("");
    }

    return "";
  }, "");
}

/**
 * Extracts properties from an intersection type
 */
function extractIntersectionProperties(
  typedef: typedoc.DeclarationReflection,
): typedoc.DeclarationReflection[] {
  const properties: typedoc.DeclarationReflection[] = [];

  if (typedef.type?.type === "intersection") {
    // Handle intersection types
    const types = (typedef.type as typedoc.IntersectionType).types;
    for (const type of types) {
      if (type.type === "reference" && type.reflection?.children) {
        properties.push(...type.reflection.children);
      } else if (type.type === "reflection" && type.declaration.children) {
        // Handle inline object types
        properties.push(...type.declaration.children);
      } else if (type.type === "union") {
        // Handle union types
        for (const unionType of type.types) {
          if (
            unionType.type === "reflection" &&
            unionType.declaration.children
          ) {
            properties.push(...unionType.declaration.children);
          }
        }
      }
    }
  }

  if (typedef.children) {
    properties.push(...typedef.children);
  }

  const uniqueProps = new Map<string, typedoc.DeclarationReflection>();
  for (const prop of properties) {
    if (!uniqueProps.has(prop.name)) {
      uniqueProps.set(prop.name, prop);
    }
  }

  return Array.from(uniqueProps.values());
}

async function generateDocumentation() {
  if (process.argv.includes("--clean") || process.argv.includes("-c")) {
    const docsExists = await fs.access(docsEntryPath).catch(() => false);
    if (docsExists) {
      logger.info("Cleaning up old files...");
      await fs.rm(docsEntryPath, { force: true });
    }
  }

  const docsExists = await fs.access(docsEntryPath).catch(() => false);
  if (!docsExists) {
    logger.info("Creating api-legacy directory...");
    await fs.mkdir(docsEntryPath, { recursive: true });
  }

  await totalist(apiEntryPath, async (_, absPath) => {
    if (absPath.endsWith(".d.ts") || !absPath.endsWith(".ts")) return;

    files.add(absPath);
  });

  try {
    logger.info("Bootstrapping documentation...");
    const app = await typedoc.Application.bootstrap({
      entryPoints: [...files],
      name: "api-legacy",
    });

    const project = await app.convert();
    if (!project) {
      throw new Error("Failed to generate project");
    }

    await app.generateJson(project!, join(process.cwd(), "api-legacy.json"));

    let jsonData: Array<{
      label: string;
      items?: Array<{ label: string; link: string }>;
      link?: string;
      collapsed?: boolean;
    }> = [];

    const sidebarGroups = new Map<
      string,
      Array<{ label: string; link: string }>
    >();

    const classList: Class[] = [];

    for (const child of project.children ?? []) {
      if (child.kind === typedoc.ReflectionKind.Module /* 2 */) {
        const classes =
          child.children?.filter(
            (child) => child.kind === typedoc.ReflectionKind.Class /* 128 */,
          ) ?? [];

        // TODO: we can read child.groups and find by title instead
        // of filtering by kind

        const enums =
          child?.children?.filter(
            (child) => child.kind === typedoc.ReflectionKind.Enum /* 8 */,
          ) ?? [];

        const typedefs =
          child?.children?.filter(
            (child) => child.kind === typedoc.ReflectionKind.TypeAlias /* 64 */,
          ) ?? [];

        for (const enum_ of enums) {
          const mdxFileContent = [
            "---",
            `title: ${enum_.name}`,
            "---",
            "",
            "## Members",
            "",
          ];

          for (let idx = 0; idx < (enum_.children ?? [])?.length; idx++) {
            const enumChild = enum_.children?.[idx];
            if (!enumChild) continue;

            if (enumChild.kind === typedoc.ReflectionKind.EnumMember /* 16 */) {
              const memberName = enumChild.name;
              const memberDescription =
                makeDescription(enumChild.comment?.summary ?? []) || "";

              // console.log(
              //   `\tEnum member name: ${memberName} (${enumChild?.type?.toString()}): ${makeDescription(enumChild?.comment?.summary ?? [])}...`,
              // );

              mdxFileContent.push(
                `### ${memberName} = \`${enumChild.type?.toString()}\``,
              );
              if (memberDescription) {
                mdxFileContent.push(memberDescription.split("\n").join("\n"));
              }
              mdxFileContent.push("");
              mdxFileContent.push("---");
            }
          }

          const mdxFilePath = join(docsEntryPath, "enums", `${enum_.name}.mdx`);

          await fs.mkdir(dirname(mdxFilePath), {
            recursive: true,
          });
          await fs.writeFile(mdxFilePath, mdxFileContent.join("\n"), {
            encoding: "utf-8",
          });

          if (!sidebarGroups.has("enums")) {
            sidebarGroups.set("enums", []);
          }

          sidebarGroups.get("enums")?.push({
            label: enum_.name,
            link: `/api-legacy/enums/${enum_.name.toLowerCase()}`,
          });
        }

        for (const typedef of typedefs) {
          // console.log(
          //   `typedef: ${typedef.name} (${typedef?.type?.toString()}): ${makeDescription(
          //     typedef?.comment?.summary ?? [],
          //   )}...`,
          // );

          const mdxFileContent = ["---", `title: ${typedef.name}`, "---", ""];

          // Make a table of the typedef, Name | Type | Description
          mdxFileContent.push("| Name | Type | Description |");
          mdxFileContent.push("|------|------|-------------|");
          const properties = extractIntersectionProperties(typedef);
          for (const child of properties) {
            if (child.kind === typedoc.ReflectionKind.Property /* 1024 */) {
              const propName = child.name;
              const propDescription =
                makeDescription(child.comment?.summary ?? []) || "";
              const propType = child.type?.toString() || "";

              const safeType = propType.includes("|")
                ? propType
                    .split("|")
                    .map((t) => `\`${t.trim()}\``)
                    .join(" \\| ")
                : `\`${propType}\``;

              mdxFileContent.push(
                `| ${propName} | ${safeType} | ${propDescription} |`,
              );
            }
          }

          const mdxFilePath = join(
            docsEntryPath,
            "typedefs",
            `${typedef.name}.mdx`,
          );

          await fs.mkdir(dirname(mdxFilePath), {
            recursive: true,
          });
          await fs.writeFile(mdxFilePath, mdxFileContent.join("\n"), {
            encoding: "utf-8",
          });

          if (!sidebarGroups.has("typedefs")) {
            sidebarGroups.set("typedefs", []);
          }

          sidebarGroups.get("typedefs")?.push({
            label: typedef.name,
            link: `/api-legacy/typedefs/${typedef.name.toLowerCase()}`,
          });
        }

        for (const cls of classes) {
          const className = cls.name;
          const classDescription =
            makeDescription(cls.comment?.summary ?? []) || "";
          const baseClass = cls?.extendedTypes?.[0]?.toString() || "";

          const classProperties: Property[] = [];
          const classMethods: Method[] = [];

          const properties =
            cls.children?.filter(
              (child) =>
                child.kind === typedoc.ReflectionKind.Property /* 1024 */ ||
                child.kind === typedoc.ReflectionKind.Accessor /* 262144 */,
            ) ?? [];
          const methods =
            cls.children?.filter(
              (child) => child.kind === typedoc.ReflectionKind.Method /* 512 */,
            ) ?? [];

          // console.log(`Class: ${className}: ${classDescription}...`);

          for (const prop of properties) {
            if (!prop.flags.isPublic || prop.name.startsWith("_")) continue;

            const propName = prop.name;
            const propDescription =
              makeDescription(
                prop.comment?.summary /* property */ ??
                  prop?.getSignature?.comment?.summary /* accessor */ ??
                  [],
              ) || "";

            const isGetter =
              prop.kind === typedoc.ReflectionKind.Accessor /* 262144 */ &&
              prop?.getSignature?.kind ===
                typedoc.ReflectionKind.GetSignature; /* 524288 */
            const isSetter =
              prop.kind === typedoc.ReflectionKind.Accessor /* 262144 */ &&
              prop?.setSignature?.kind ===
                typedoc.ReflectionKind.SetSignature; /* 1048576 */

            const propType =
              prop?.type?.toString() ??
              prop?.getSignature?.type?.toString() ??
              "";

            // console.log(
            //   `Property: ${propName} [${propType}]: ${propDescription} ${isGetter ? "(getter)" : ""} ${isSetter ? "(setter)" : ""}...`,
            // );

            const property: Property = {
              name: propName,
              description: propDescription,
              type: propType,
              isGetter,
              isSetter,
            };
            classProperties.push(property);
          }

          for (const mth of methods) {
            if (
              excludedMethods[className]?.includes(mth.name) ||
              !mth.flags.isPublic
            )
              continue;

            const { isStatic } = mth.flags;

            const methodName = mth.name;
            const methodDescription =
              makeDescription(mth.signatures?.[0]?.comment?.summary ?? []) ||
              ""; // we only have 1 overload and the description is the same for all of them, should be safe
            const methodParameters = mth?.signatures?.[0]?.parameters
              ?.map((param) => {
                const paramName = param.name;
                const paramDescription =
                  makeDescription(param.comment?.summary ?? []) || "";
                const paramType = param.type?.toString() || "";
                const paramDefaultValue = param?.defaultValue?.toString() || "";

                return {
                  name: paramName,
                  description: paramDescription,
                  type: paramType,
                  defaultValue: paramDefaultValue,
                };
              })
              .filter((param) => Boolean(param)) as Parameter[];
            const returnType = mth.signatures?.[0]?.type?.toString() || "";
            const exampleCode =
              makeBlockTag(mth?.signatures?.[0]?.comment?.blockTags ?? [])
                .replace("```ts", "")
                .replace("```", "") || "";

            // console.log(
            //   `Method: ${methodName} [${returnType}] (${isStatic}) ${methodDescription}...`,
            // );
            // console.log(`
            // ${className}::${methodName}(${methodParameters?.map((param) => `${param.name}: ${param.type}${param.defaultValue ? ` = ${param.defaultValue}` : ""}`).join(", ")}) [${returnType}]`);

            const method: Method = {
              name: methodName,
              description: methodDescription,
              parameters: methodParameters,
              returnType,
              example: exampleCode,
              isStatic,
            };
            classMethods.push(method);
          }

          classList.push({
            name: className,
            description: classDescription,
            properties: classProperties,
            methods: classMethods,
            baseClass,
          });

          const fileName = cls?.sources?.[0]?.fullFileName?.replace(
            apiEntryPath,
            "",
          ); // a.ts, x/y.ts

          const mdxFileName = fileName?.replace(/\.ts$/, ".mdx");
          const mdxFilePath = join(docsEntryPath, mdxFileName ?? "");

          const mdxFileContent = [
            "---",
            `title: ${className}`,
            "---",
            "",
            `import { Badge, Code } from "@astrojs/starlight/components";`,
            "",
          ];

          if (classDescription) {
            mdxFileContent.push(
              classDescription.split("\n").join("\n\n"),
              "\n",
            );
          }

          if (classProperties.length) {
            mdxFileContent.push("## Properties");
            for (const prop of classProperties) {
              mdxFileContent.push(
                `### ${prop.name}${prop.isGetter ? ' <Badge text="Getter" size="small" />\t' : ""}${prop.isSetter ? ' <Badge text="Setter" size="small" />' : ""}`,
              );
              if (prop.description) {
                mdxFileContent.push(prop.description.split("\n").join("\n"));
              }
              mdxFileContent.push("");
              mdxFileContent.push(`Type: \`${prop.type}\``);
              mdxFileContent.push("");
            }
          }

          if (classMethods.length) {
            mdxFileContent.push("## Methods");
            mdxFileContent.push("");
            for (const mth of classMethods) {
              mdxFileContent.push(
                `### ${mth.name}${mth.isStatic ? ' <Badge text="static" />' : ""}`,
              );

              if (mth.description) {
                mdxFileContent.push(`${mth.description}`);
              }

              if (mth.example) {
                // <Code code={exampleCode} lang="js" title={fileName} mark={highlights} />
                mdxFileContent.push(
                  `\n<Code code={\`${mth.example}\`} lang="js" title="${fileName}" />`,
                );
              }

              if (mth.parameters && mth.parameters.length > 0) {
                const hasOptionalOrDefaultParams = mth.parameters.some(
                  (param) => param.defaultValue,
                );

                if (hasOptionalOrDefaultParams) {
                  mdxFileContent.push(
                    "| Parameter | Type | Optional | Default | Description |",
                  );
                  mdxFileContent.push(
                    "|-----------|------|----------|---------|-------------|",
                  );

                  for (const param of mth.parameters) {
                    // TODO: ideally we have hyperlinks to types
                    const safeType = param.type.includes("|")
                      ? param.type
                          .split("|")
                          .map((t) => `\`${t.trim()}\``)
                          .join(" \\| ")
                      : `\`${param.type}\``;
                    const defaultValue = param.defaultValue
                      ? `\`${param.defaultValue}\``
                      : "";
                    const isOptional = param.defaultValue ? "✓" : "";
                    const description = param.description || "";

                    mdxFileContent.push(
                      `| ${param.name} | ${safeType} | ${isOptional} | ${defaultValue} | ${description} |`,
                    );
                  }
                } else {
                  mdxFileContent.push("| Parameter | Type | Description |");
                  mdxFileContent.push("|-----------|------|-------------|");

                  for (const param of mth.parameters) {
                    const safeType = param.type.includes("|")
                      ? param.type
                          .split("|")
                          .map((t) => `\`${t.trim()}\``)
                          .join(" \\| ")
                      : `\`${param.type}\``; // Wrap all types in backticks
                    const description = param.description || "";

                    mdxFileContent.push(
                      `| ${param.name} | ${safeType} | ${description} |`,
                    );
                  }
                }
              }

              mdxFileContent.push("");
              mdxFileContent.push(`**Returns**: \`${mth.returnType}\``);
              mdxFileContent.push("");
            }
          }

          await fs.mkdir(dirname(mdxFilePath), { recursive: true });
          await fs.writeFile(mdxFilePath, mdxFileContent.join("\n"), {
            encoding: "utf-8",
          });

          const sidebarDirName = dirname(mdxFileName ?? "").replace(".", "");
          if (sidebarDirName) {
            if (!sidebarGroups.has(sidebarDirName)) {
              sidebarGroups.set(sidebarDirName, []);
            }

            sidebarGroups.get(sidebarDirName)?.push({
              label: className,
              link: `/api-legacy/${sidebarDirName}/${className.toLowerCase()}`,
            });
          } else {
            jsonData.push({
              label: className,
              link: `/api-legacy/${className.toLowerCase()}`,
            });
          }
        }
      }
    }

    const priority = ["models", "typedefs", "enums", "util"];

    // Sort sidebar groups by priority
    const sortedSidebarGroups = [...sidebarGroups.entries()].sort(
      ([groupA], [groupB]) =>
        priority.indexOf(groupB) - priority.indexOf(groupA),
    );

    // Add sorted sidebar groups to jsonData
    for (const [groupName, items] of sortedSidebarGroups) {
      jsonData.unshift({
        label: groupName.charAt(0).toUpperCase() + groupName.slice(1),
        items: items,
        collapsed: true,
      });
    }

    await fs.writeFile(
      join(process.cwd(), "docs/api-legacy.json"),
      JSON.stringify(jsonData, null, 2),
      { encoding: "utf-8" },
    );

    // logger.info("Generating documentation...");
  } catch (error) {
    logger.error(`Error generating documentation: ${error}`);
  }
}

generateDocumentation();

type Class = {
  /**
   * The name of the class.
   */
  name: string;
  /**
   * The description of the class.
   */
  description?: string;
  /**
   * The properties of the class.
   */
  properties?: Property[];
  /**
   * The methods of the class.
   */
  methods?: Method[];
  /**
   * The base class of the class.
   */
  baseClass?: string;
};
type Property = {
  /**
   * The name of the property.
   */
  name: string;
  /**
   * The description of the property.
   */
  description?: string;
  /**
   * The type of the property.
   */
  type: string;
  /**
   * Whether the property is a getter.
   */
  isGetter: boolean;
  /**
   * Whether the property is a setter.
   */
  isSetter: boolean;
};
type Method = {
  /**
   * The name of the method.
   */
  name: string;
  /**
   * The description of the method.
   */
  description?: string;
  /**
   * The parameters of the method.
   */
  parameters: Parameter[];
  /**
   * The return type of the method.
   */
  returnType: string;
  /**
   * Example code for the method.
   */
  example?: string;
  /**
   * Whether the method is static.
   */
  isStatic: boolean;
};
type Parameter = {
  /**
   * The name of the parameter.
   */
  name: string;
  /**
   * The description of the parameter.
   */
  description?: string;
  /**
   * The type of the parameter.
   */
  type: string;
  /**
   * The default value of the parameter.
   */
  defaultValue?: string;
};
