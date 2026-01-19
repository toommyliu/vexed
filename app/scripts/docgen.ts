import { dirname, join, basename } from "node:path";
import { totalist } from "totalist";
import * as typedoc from "typedoc";
import fs from "node:fs/promises";

const logger = new typedoc.ConsoleLogger();

// Generate api documentation for the commands
const generateCommandsApiDoc = async () => {
  const apiEntryPath = join(
    process.cwd(),
    "src/renderer/game/botting/commands/",
  );
  const docsEntryPath = join(process.cwd(), "../docs/src/content/docs/api/");

  await initializeDirectory(docsEntryPath);

  const files = new Set<string>();
  await totalist(apiEntryPath, (_, absPath) => {
    if (basename(absPath) === "index.ts") {
      files.add(absPath);
    }
  });

  try {
    const project = await createTypedocApp([...files], "api");

    const namespaces = new Map<string, Namespace>();

    for (const child of project.children ?? []) {
      if (child.kind === typedoc.ReflectionKind.Module /* 2 */) {
        // should be the only one available
        const commands = child.children?.find((child_) => {
          return (
            child_?.name === `${child.name}Commands` &&
            child_.kind === typedoc.ReflectionKind.Variable /* 32 */ &&
            child_?.flags?.isConst
          );
        });

        if (!commands) {
          continue;
        }

        const namespaceName = child.name;
        const namespaceDescription =
          makeDescription(child.comment?.summary ?? []) || "";
        const namespaceMethods: Method[] = [];

        if (commands?.type instanceof typedoc.ReflectionType) {
          for (const child of (commands?.type as typedoc.ReflectionType)
            ?.declaration?.children ?? []) {
            if (child?.kind === typedoc.ReflectionKind.Method /* 512 */) {
              const funcName = child.name;
              const funcDescription =
                makeDescription(
                  child?.signatures?.[0]?.comment?.summary ?? [],
                ) || "";

              const exampleCode = makeBlockTag(
                child?.signatures?.[0]?.comment?.blockTags ?? [],
              );

              const remarkCode = makeBlockTag(
                child?.signatures?.[0]?.comment?.blockTags ?? [],
                "@remarks",
              );

              let deprecatedCode = makeBlockTag(
                child?.signatures?.[0]?.comment?.blockTags ?? [],
                "@deprecated",
              );

              const funcParameters = child?.signatures?.[0]?.parameters
                ?.map((param) => {
                  const paramName = param.name;
                  let paramDescription =
                    makeTableDescription(param.comment?.summary ?? []) || "";
                  const paramType = param.type?.toString() || "";
                  const paramDefaultValue =
                    param?.defaultValue?.toString() || "";
                  const paramIsOptional = param?.flags?.isOptional;

                  if (!paramDescription && deprecatedCode) {
                    paramDescription = `Deprecated: ${deprecatedCode}`;
                    deprecatedCode = "";
                  }

                  return {
                    name: paramName,
                    description: paramDescription,
                    type: paramType,
                    defaultValue: paramDefaultValue,
                    isOptional: paramIsOptional,
                  };
                })
                .filter((param) => Boolean(param)) as Parameter[];

              const method: Method = {
                name: funcName,
                description: funcDescription,
                parameters: funcParameters,
                returnType: "",
                isStatic: false,
                example: exampleCode,
                remark: remarkCode,
                deprecated: deprecatedCode || undefined,
              };
              namespaceMethods.push(method);
            }
          }

          const namespace: Namespace = {
            name: namespaceName,
            description: namespaceDescription,
            methods: namespaceMethods,
          };
          namespaces.set(namespaceName, namespace);

          const mdxFileContent = [
            "---",
            `title: ${makeTitleCase(namespaceName)} commands`,
            "head:",
            " - tag: title",
            `   content: ${makeTitleCase(namespaceName)} commands`,
            "---",
            "",
            `import { Badge, Code } from "@astrojs/starlight/components";`,
            "",
          ];
          if (namespaceDescription) {
            mdxFileContent.push(
              namespaceDescription.split("\n").join("\n\n"),
              "",
            );
          }

          for (const method of namespaceMethods) {
            mdxFileContent.push(`### cmd.${method.name}`);

            if (method.deprecated) {
              mdxFileContent.push(`:::caution[Deprecated]`);
              mdxFileContent.push(method.deprecated);
              mdxFileContent.push(`:::`);
              mdxFileContent.push("");
            }

            if (method.description) {
              mdxFileContent.push(method.description);
              mdxFileContent.push("");
            }

            if (method.remark) {
              mdxFileContent.push(`:::note[Remarks]`);
              mdxFileContent.push(method.remark);
              mdxFileContent.push(`:::`);
              mdxFileContent.push("");
            }

            if (method.parameters && method.parameters.length > 0) {
              const hasOptionalOrDefaultParams = method.parameters.some(
                (param) => param.defaultValue,
              );

              if (hasOptionalOrDefaultParams) {
                mdxFileContent.push(
                  "| Parameter | Type | Optional | Default | Description |",
                  "|-----------|------|----------|---------|-------------|",
                );

                for (const param of method.parameters) {
                  const paramType = param.isOptional
                    ? `${makeSafeType(`${param.type}?`)}`
                    : makeSafeType(param.type);
                  const paramDefaultValue = param.defaultValue
                    ? `\`${param.defaultValue}\``
                    : "";
                  const paramIsOptional =
                    param.isOptional || param.defaultValue ? "✓" : "";
                  const description = param.description || "";

                  mdxFileContent.push(
                    `| ${param.name} | ${paramType} | ${paramIsOptional} | ${paramDefaultValue} | ${description} |`,
                  );
                }
              } else {
                mdxFileContent.push(
                  "| Parameter | Type | Description |",
                  "|-----------|------|-------------|",
                );

                for (const param of method.parameters) {
                  const paramSafeType = param.isOptional
                    ? `${makeSafeType(`${param.type}?`)}`
                    : makeSafeType(param.type);

                  const description = param.description || "";

                  mdxFileContent.push(
                    `| ${param.name} | ${paramSafeType} | ${description} |`,
                  );
                }
              }
              mdxFileContent.push("");
            }

            if (method.example) {
              const escapedExample = method.example.replace(/`/g, "\\`");
              mdxFileContent.push(
                `<Code code={\`${escapedExample}\`} lang="js" />`,
              );
              mdxFileContent.push("");
            }

            mdxFileContent.push("");
          }

          const mdxFilePath = join(docsEntryPath, `${namespaceName}.mdx`);
          await writeFile(mdxFilePath, mdxFileContent);
        }
      }
    }

    // Generate the sidebar
    const sidebar = Array.from(namespaces.values()).map((namespace) => {
      return {
        label: makeTitleCase(namespace.name),
        link: `/api/${namespace.name.toLowerCase()}`,
      };
    });

    const sorted = sidebar.sort((a, b) => a.label.localeCompare(b.label));

    const sidebarFilePath = join(process.cwd(), "../docs/api.json");
    await fs.writeFile(sidebarFilePath, JSON.stringify(sorted, null, 2), {
      encoding: "utf-8",
    });

    logger.info("API documentation generated successfully!");
  } catch (error) {
    logger.error(
      `Error generating api documentation: ${error}\n${(error as Error)?.stack}`,
    );
  }
};

/**
 * Converts a summary block to a description string.
 */
function makeDescription(summary: typedoc.CommentDisplayPart[]): string {
  return summary.reduce((acc, part) => {
    if (part.kind === "text" || part.kind === "code") {
      return acc + part.text;
    }
    return "";
  }, "");
}

/**
 * Converts a summary block to a description string suitable for table use.
 * Replaces newlines with spaces to prevent table formatting issues.
 */
function makeTableDescription(summary: typedoc.CommentDisplayPart[]): string {
  return makeDescription(summary).replace(/\n/g, " ").trim();
}

/**
 * Converts a block tag to a string.
 */
function makeBlockTag(
  tag: typedoc.CommentTag[],
  targetTag: string = "@example",
): string {
  return tag.reduce((acc, part) => {
    if (part.tag === targetTag) {
      const content = part.content.map((p) => p.text).join("");
      if (targetTag === "@example") {
        // Remove markdown code block markers since <Code> component handles syntax highlighting
        return (
          acc +
          content
            .replace(/```[a-zA-Z]*\n?/g, "")
            .replace(/```\n?/g, "")
            .replace(/^\n+|\n+$/g, "")
        );
      }

      // For remarks and other tags, preserve internal newlines but trim leading/trailing whitespace
      return acc + content.replace(/^\s+|\s+$/g, "");
    }
    return acc;
  }, "");
}

/**
 * Converts a string to title case.
 *
 * @param str - The string to convert.
 */
function makeTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Registry of all generated types and their documentation links
 */
type TypeRegistry = Map<string, string>;

/**
 * Safely converts a string type to a table-safe type with hyperlinks.
 *
 * @param type - The type to convert.
 * @param typeRegistry - Registry of type names to their documentation links.
 */
function makeSafeType(type: string, typeRegistry?: TypeRegistry): string {
  if (!typeRegistry) {
    if (type.includes("|")) {
      return type
        .split("|")
        .map((t) => `\`${t.trim()}\``)
        .join(" \\| ");
    }
    return `\`${type}\``;
  }

  // Handle array types like "SomeType[]"
  const arrayMatch = type.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    const baseType = arrayMatch[1];
    const linkedBaseType = makeSafeType(baseType, typeRegistry);
    return `${linkedBaseType}[]`;
  }

  // Handle union types like "Type1 | Type2"
  if (type.includes("|")) {
    const unionTypes = type.split("|").map((t) => t.trim());
    const linkedTypes = unionTypes.map((t) => {
      if (typeRegistry.has(t)) {
        return `[\`${t}\`](${typeRegistry.get(t)})`;
      }
      return `\`${t}\``;
    });
    return linkedTypes.join(" \\| ");
  }

  // Handle optional types like "SomeType?"
  const optionalMatch = type.match(/^(.+)\?$/);
  if (optionalMatch) {
    const baseType = optionalMatch[1];
    const linkedBaseType = makeSafeType(baseType, typeRegistry);
    return `${linkedBaseType}?`;
  }

  // Handle generic types like "Partial<KillOption>", "Record<string, Type>", etc.
  const genericMatch = type.match(/^([^<]+)<(.+)>$/);
  if (genericMatch) {
    const genericType = genericMatch[1]; // e.g., "Partial", "Record"
    const innerTypes = genericMatch[2]; // e.g., "KillOption", "string, Type"

    // Handle nested generic types and comma-separated type parameters
    const typeParams = splitTypeParameters(innerTypes);
    const linkedTypeParams = typeParams.map((param) => {
      const linkedParam = makeSafeType(param.trim(), typeRegistry);
      // Remove backticks from linked parameters to avoid nested backticks
      return linkedParam.replace(/^`|`$/g, "");
    });

    // Don't wrap in backticks if any parameter contains a hyperlink
    const hasLinks = linkedTypeParams.some((param) => param.includes("]("));
    if (hasLinks) {
      return `${genericType}&lt;${linkedTypeParams.join(", ")}&gt;`;
    } else {
      return `\`${genericType}<${linkedTypeParams.join(", ")}>\``;
    }
  }

  // Check if this type is in our registry
  if (typeRegistry.has(type)) {
    return `[\`${type}\`](${typeRegistry.get(type)})`;
  }

  // Default case - just wrap in code ticks
  return `\`${type}\``;
}

/**
 * Splits type parameters correctly, handling nested generics
 * Example: "string, Record<string, number>" => ["string", "Record<string, number>"]
 */
function splitTypeParameters(typeParams: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < typeParams.length; i++) {
    const char = typeParams[i];

    if (char === "<") {
      depth++;
    } else if (char === ">") {
      depth--;
    } else if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

async function initializeDirectory(path: string): Promise<void> {
  const exists = await fs
    .access(path)
    .then(() => true)
    .catch(() => false);

  if (process.argv.includes("--clean") || process.argv.includes("-c")) {
    if (exists) {
      logger.info("Cleaning up old files...");
      await fs.rm(path, { force: true, recursive: true });
    }
  }

  if (!exists) {
    logger.info(`Creating directory: ${path}`);
    await fs.mkdir(path, { recursive: true });
  }
}

/**
 * Generates a TypeDoc application.
 *
 * @param files - The files to include.
 * @param name - The name of the project.
 */
async function createTypedocApp(files: string[], name: string) {
  logger.info(`Bootstring Typedoc app for "${name}"...`);
  const app = await typedoc.Application.bootstrap({
    entryPoints: [...files],
    name,
  });

  const project = await app.convert();
  if (!project) {
    throw new Error(`Failed to generate project: ${name}`);
  }

  await app.generateJson(project, join(process.cwd(), `${name}.json`));
  return project;
}

async function writeFile(filePath: string, content: string[]) {
  await fs.mkdir(dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content.join("\n"), { encoding: "utf-8" });
}

// Generate TypeScript declarations for the commands API
const generateCommandsTypesFile = async () => {
  const apiEntryPath = join(
    process.cwd(),
    "src/renderer/game/botting/commands/",
  );

  // Output path for the types file
  const typesOutputPath = join(process.cwd(), "../commands.d.ts");

  const files = new Set<string>();
  await totalist(apiEntryPath, (_, absPath) => {
    if (basename(absPath) === "index.ts") {
      files.add(absPath);
    }
  });

  try {
    const project = await createTypedocApp([...files], "api-types");

    const typeDefinitions = new Set<string>();
    const commandInterfaces: string[] = [];

    // Don't care, inline the types needed
    const customTypes = `export interface KillOptions {
  /** An ascending list of monster names or monMapIDs to kill. This can also be a string of monsterResolvables deliminted by a comma. */
  killPriority: string[] | string;
  /** Optional AbortSignal that can be used to abort kill operation early. When the signal is aborted, the kill method will immediately stop and resolve. */
  signal?: AbortSignal;
  /** Custom skill action function that provides alternative combat logic. It should be implemented as a closure that returns an async function. When provided, this function replaces the default skill rotation logic. The outer and inner functions are bound with \`bot\` context. Skill logic should be implemented in the inner function. */
  skillAction: (() => () => Promise<void>) | null;
  /** The delay between each skill cast. */
  skillDelay: number;
  /** The order of skills to use. */
  skillSet: number[];
  /** Whether to wait for the skill to be available before casting. */
  skillWait: boolean;
}

/**
 * Base class for all commands.
 */
export class Command {
  /** Whether to skip the delay for this command */
  public skipDelay?: boolean;

  /**
   * The function that is called when the command is executed.
   *
   * This function has access to:
   * - "this.bot" - The bot instance.
   * - "this.ctx" - The scripting context environment (undocumented).
   * - "this.args" - The command arguments (only for custom commands).
   */
  declare execute: () => Promise<void> | void;

  declare toString: () => string;
}

export interface CommandConstructor {
  /**
   * Base class for all commands.
   */
  new (): Command;
}`;

    typeDefinitions.add(customTypes);

    for (const child of project.children ?? []) {
      if (child.kind === typedoc.ReflectionKind.Module) {
        const commands = child.children?.find((child_) => {
          return (
            child_?.name === `${child.name}Commands` &&
            child_.kind === typedoc.ReflectionKind.Variable &&
            child_?.flags?.isConst
          );
        });

        if (!commands) {
          continue;
        }

        if (commands?.type instanceof typedoc.ReflectionType) {
          for (const methodChild of (commands?.type as typedoc.ReflectionType)
            ?.declaration?.children ?? []) {
            if (methodChild?.kind === typedoc.ReflectionKind.Method) {
              const funcName = methodChild.name;
              const signature = methodChild.signatures?.[0];

              if (signature) {
                const parameters =
                  signature.parameters
                    ?.map((param) => {
                      const paramName = param.name;
                      const paramType = param.type?.toString() || "unknown";
                      const isOptional = param.flags?.isOptional;
                      const defaultValue = param?.defaultValue?.toString();

                      const cleanType = paramType
                        .replace(/import\([^)]+\)\./g, "")
                        .replace(/typeof Command/g, "CommandConstructor")
                        .replace(/typeof /g, "")
                        .replace(
                          /Partial<import[^>]+>/g,
                          "Partial<KillOptions>",
                        );

                      const optional = isOptional || defaultValue ? "?" : "";
                      return `${paramName}${optional}: ${cleanType}`;
                    })
                    .join(", ") || "";

                const description = makeDescription(
                  signature.comment?.summary ?? [],
                );
                const methodSignature = description
                  ? `  /** ${description} */\n  ${funcName}(${parameters}): void;`
                  : `  ${funcName}(${parameters}): void;`;

                commandInterfaces.push(methodSignature);
              }
            }
          }
        }
      }
    }

    const typesContent = [
      "",
      ...Array.from(typeDefinitions),
      "",
      "declare const cmd: {",
      ...commandInterfaces,
      "};",
      "",
      "export = cmd;",
      "export as namespace cmd;",
      "",
    ];

    await fs.writeFile(typesOutputPath, typesContent.join("\n"), {
      encoding: "utf-8",
    });
    logger.info(`Generated commands types file: ${typesOutputPath}`);
  } catch (error) {
    logger.error(`Failed to generate commands types: ${error}`);
  }
};

Promise.all([
  generateCommandsApiDoc(),
  generateCommandsTypesFile(),
]);

type Namespace = {
  /**
   * The name of the namespace.
   */
  name: string;
  /**
   * The description of the namespace.
   */
  description?: string;
  /**
   * The methods of the namespace.
   */
  methods?: Method[];
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
   * Remarks for the method.
   */
  remark?: string;
  /**
   * Deprecation message for the method.
   */
  deprecated?: string;
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
  /**
   * Whether the parameter is optional.
   */
  isOptional?: boolean;
};
