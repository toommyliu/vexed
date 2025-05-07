const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const ts = require("typescript");

/**
 * Makes a NOTE alert with the given lines.
 *
 * @param {string[]} lines
 * @returns {string} The formatted note alert.
 */
const makeNoteAlert = (lines) =>
  `> [!NOTE]\n${lines.map((str) => `> ${str}`).join("\n")}\n`;

/**
 * Map of function names to type replacements for their parameters.
 *
 * @type {TypeReplacementMap}
 */
const typeReplacements = {
  kill: {
    "Partial<KillOptions>": "KillOptions",
  },
  kill_for_item: {
    "Partial<KillOptions>": "KillOptions",
  },
  kill_for_temp_item: {
    "Partial<KillOptions>": "KillOptions",
  },
  army_kill: {
    "Partial<KillOptions>": "KillOptions",
  },
  army_kill_for: {
    "Partial<KillOptions>": "KillOptions",
  },
};

/**
 * Map of descriptions for files and functions.
 *
 * @type {DescriptionMap}
 */
const descriptions = {
  files: {
    "combat/index.ts": makeNoteAlert([
      '- `target` refers to monster name or in the format "id:monMapId" (where `:` can be replaced with any of these delimiters: `\'` `.` `-` )',
      "   - Example formats: `id.1` (left orb) | `id:3` (right orb)",
      "- `item` can be name or id",
    ]),
    "army/index.ts": makeNoteAlert([
      "Army commands are for advanced users only.",
    ]),
  },
  functions: {
    // # region army commands
    "cmd.army_init": makeNoteAlert([
      "Must be called before any other army commands to load the config file.",
      "Recommended to call this right after cmd.army_set_config to load the config asap.",
    ]),
    "cmd.army_set_config": makeNoteAlert([
      "Sets the config file to use for armying. The file will be searched in:",
      "",
      "- The app's documents folder (Documents/vexed)",
      "",
      "- The app's storage folder (Documents/vexed/storage)",
      "",
      "Just the filename without the path or extension.",
    ]),
    "cmd.army_join": makeNoteAlert([
      "Like [World#join](../api-legacy/World.md#join) but waits for all players to join before proceeding to the next command.",
    ]),
    "cmd.army_kill_for": makeNoteAlert([
      "Recommended to pass a custom skillAction function to options when you need granular control for skill casting (should be a closure).",
      "",
      "[bot](../api-legacy/Bot.md) is bounded as the **this** context in the skillAction and closure functions. Note the functions, not arrow functions.",
      "",
      "Note that internally, this wraps [Combat#kill](../api-legacy/Combat.md#kill) but with laxed item checks.",
      "Therefore, the closure can be re-created every call to kill(), so try and avoid storing sensitive state in the closure.",
      "",
      "```js",
      "cmd.army_kill_for(",
      "	'Ultra Engineer',",
      "	'Ultra Engineer Defeated',",
      "	1,",
      "	true,",
      "	{",
      "		skillPriority: ['id.1','id.2']",
      "		skillAction() {",
      "			let a = []",
      "			let i = 0",
      "			let h",
      "",
      "			switch (this.bot.player.className) {",
      '			case "LEGION REVENANT":',
      "				a=[3,1,2,4,5]",
      "				break",
      '			case "STONECRUSHER":',
      "				a=[1,2,3,4,5]",
      "				break",
      '			case "LORD OF ORDER":',
      "				a=[1,3,4,5]",
      "				h=2",
      "				break",
      '			case "ARCHPALADIN":',
      "				a=[1,3,4,5]",
      "				h=2",
      "			}",
      "",
      "			return async function() {",
      "				for (const plyr /* string */ of this.bot.army.players) {",
      "					const p = this.bot.world.players.get(plyr)",
      "					if (p.isHpPercentageLessThan(70) && h) {",
      "						await this.bot.combat.useSkill(h)",
      "						return",
      "					}",
      "				}",
      "",
      "				await this.bot.combat.useSkill(a[i])",
      "				i = (i + 1) % a.length",
      "			}",
      "		}",
      "	}",
      ")",
      "```",
    ]),
    "cmd.execute_with_army": makeNoteAlert([
      "Executes the given function. Once the function resolves, the player will be marked as done.",
      "",
      "The proceeding command cannot proceed until all players are done.",
      "",
      "The function is called with [bot](../api-legacy/Bot.md) as the first argument.",
    ]),
    // # endregion
    // # region combat commands
    "cmd.kill": makeNoteAlert([
      "[KillOptions](/api-legacy/typedefs/KillOptions)",
    ]),
    "cmd.kill_for_item": makeNoteAlert([
      "[KillOptions](/api-legacy/typedefs/KillOptions)",
    ]),
    "cmd.kill_for_temp_item": makeNoteAlert([
      "[KillOptions](/api-legacy/typedefs/KillOptions)",
    ]),
    // #endregion
    "cmd.register_drop": makeNoteAlert([
      "drops should be registered as soon as possible and must be the full name of the drop.",
    ]),
    "cmd.register_boost": makeNoteAlert([
      "Boosts should be registered as soon as possible and must be the full name of the boost.",
    ]),
    "cmd.unregister_boost": makeNoteAlert([
      "Boosts should be registered as soon as possible and must be the full name of the boost.",
    ]),
    "cmd.set_spawn": makeNoteAlert([
      "Sets the player spawnpoint to the current cell if no arguments are provided.",
    ]),
    // #region misc commands
    "cmd.delay": makeNoteAlert(["delay is in ms"]),
    "cmd.set_delay": makeNoteAlert(["delay is in ms"]),
    "cmd.wait_for_player_count": makeNoteAlert(["wait for map player count"]),
    "cmd.enable_anticounter": makeNoteAlert([
      'Enables the anti-counter handler when a "prepares a counter attack" message is detected, which stops attacking until the counter attack ends.',
    ]),
    "cmd.goto_house": makeNoteAlert([
      "If no player is provided, it will go to your house.",
    ]),
    "cmd.buff": makeNoteAlert([
      "Naively buffs by casting the first three skills.",
    ]),
    "cmd.buy_lifesteal": makeNoteAlert(["Buys Scroll of Life Steal."]),
    "cmd.start_autoaggro": makeNoteAlert([
      `Starts autoaggro, which is different to [cmd.start_aggromon](/api/misc#cmd-start-aggromon),
in that it automatically aggros monsters in which their cell contains a player.`,
    ]),
    "cmd.start_aggromon": makeNoteAlert([
      "Starts aggromon for the given monsters.",
      "",
      "If a monster name is provided, all instances of that monster will be tagged.",
      "If a monMapId is provided, only that monster will be tagged.",
    ]),
    // #endregion
  },
};

// #region Helpers

/**
 * Gets a description for a file.
 *
 * @param {string} filePath - The file path to get a description for.
 * @returns {string | undefined} The description for the file, if any.
 */
function getFileDescription(filePath) {
  for (const key of Object.keys(descriptions.files)) {
    if (filePath.includes(key)) {
      return descriptions.files[key];
    }
  }

  return undefined;
}

/**
 * Gets a description for a function.
 *
 * @param {string} functionName - The name of the function.
 * @returns {string | undefined} The description for the function, if any.
 */
function getFunctionDescription(functionName) {
  // realistically function names are unique, the first match should be the only match
  return (
    descriptions.functions[`cmd.${functionName.toLowerCase()}`] ??
    descriptions.functions[functionName.toLowerCase()] ??
    undefined
  );
}

/**
 * Replaces a parameter type with a custom type for a specific function.
 *
 * @param {string} functionName - The name of the function.
 * @param {string} originalType - The original type string of the parameter.
 * @returns {string} The replaced type string.
 */
function getTypeReplacement(functionName, originalType) {
  return typeReplacements?.[functionName]?.[originalType] ?? originalType;
}

// #endregion

// #region Parser

/**
 * Extract all functions from a file.
 *
 * @param {string} filePath - The path to the file.
 * @returns {FunctionInfo[]} The list of functions in the file.
 */
function extractFunctionsFromFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    code,
    ts.ScriptTarget.Latest,
    true,
  );

  /**
   * @type {FunctionInfo[]}
   */
  const functions = [];
  let foundExport = false;

  /**
   * Traverse the AST to find the first valid export
   *
   * @param {ts.Node} node - The current node
   */
  function visit(node) {
    // Stop traversing if the export was found
    if (foundExport) return;

    // export const commands = {...}
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      foundExport = true;
      for (const declaration of node.declarationList.declarations) {
        if (
          declaration.initializer &&
          ts.isObjectLiteralExpression(declaration.initializer)
        ) {
          extractFunctionsFromObject(declaration.initializer);
        }
      }
    }

    // Traverse the AST until we find the export
    if (!foundExport) {
      ts.forEachChild(node, visit);
    }
  }

  /**
   * Helper function to extract functions from an object literal
   *
   * @param {ts.ObjectLiteralExpression} objectLiteral
   */
  function extractFunctionsFromObject(objectLiteral) {
    for (const property of objectLiteral.properties) {
      // method declaration in object literal (method() {})
      if (ts.isMethodDeclaration(property)) {
        extractFunction(property.name.getText(sourceFile), property.parameters);
      }
    }
  }

  /**
   * Helper function to extract function parameter info with default values
   *
   * @param {string} name - The name of the function
   * @param {ts.NodeArray<ts.ParameterDeclaration>} parameters - The parameters of the function
   */
  function extractFunction(name, parameters) {
    /**
     * @type {ParameterInfo[]}
     */
    const params = [];
    for (const param of parameters) {
      const paramName = param.name.getText(sourceFile);
      let paramType = param.type ? param.type.getText(sourceFile) : "any";

      paramType = getTypeReplacement(name, paramType);

      const isOptional =
        Boolean(param.questionToken) || Boolean(param.initializer);

      let defaultValue;
      if (param.initializer) {
        defaultValue = param.initializer.getText(sourceFile);
      }

      params.push({
        name: paramName,
        type: paramType,
        defaultValue,
        isOptional,
      });
    }

    functions.push({
      name,
      parameters: params,
      description: getFunctionDescription(name),
    });
  }

  visit(sourceFile);
  return functions;
}

// #endregion

/**
 * @param {string} inputPath - The path to the file or directory to generate documentation for.
 * @param {string} outputPath - The path to save the generated documentation.
 */
function generateMarkdown(inputPath, outputPath) {
  const stats = fs.statSync(inputPath);

  if (!stats.isFile()) {
    throw new Error("Only files are supported");
  }

  const fileFunctions = extractFunctionsFromFile(inputPath);
  const fileDescription = getFileDescription(inputPath);

  // Simply use folder name as the title
  const folderName = path.basename(path.dirname(inputPath));

  let markdown = `# ${folderName} commands\n\n`;

  if (fileDescription) {
    markdown += `${fileDescription}\n\n`;
  }

  for (const fn of fileFunctions) {
    markdown += `## cmd.${fn.name}\n\n`;

    markdown += "```ts\n";
    markdown += `cmd.${fn.name}(`;

    // Make params string
    for (let index = 0; index < fn.parameters.length; index++) {
      const param = fn.parameters[index];
      markdown += `${param.name}: ${param.type}`;
      if (param.defaultValue) {
        markdown += ` = ${param.defaultValue}`;
      }

      if (index < fn.parameters.length - 1) {
        markdown += ", ";
      }
    }

    markdown += ")\n";
    markdown += "```\n\n";

    if (fn.description) {
      markdown += `${fn.description}\n\n`;
    }
  }

  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown);
  console.log(`Generated ${folderName}.md`);
}

async function generateDocs() {
  const BASEDIR = path.join(__dirname, "../src/renderer/game/botting/commands");

  // Get all names of the directories in the commands folder
  const directories = fs
    .readdirSync(BASEDIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  if (process.argv.includes("--clean")) {
    const excluded = [
      "for-developers",
      "examples.md",
      "index.md",
      "for-developers",
    ];
    const outputDir = path.join(__dirname, "../docs/api");

    const files = fs
      .readdirSync(outputDir)
      .filter((file) => !excluded.includes(file));

    for (const file of files) {
      fs.rmSync(path.join(outputDir, file), { force: true });
    }
  }

  for (const dir of directories) {
    const inputPath = path.join(BASEDIR, dir, "index.ts");
    const outputPath = path.join(__dirname, `../docs/api/${dir}.md`);

    generateMarkdown(inputPath, outputPath);
  }
}

generateDocs().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Mapping of function names to type replacements for their parameters.
 *
 * @typedef {object} TypeReplacementMap
 * @property {Record<string, Record<string, string>>} typeReplacements - The map of function names to type replacements.
 */

/**
 * Mapping of descriptions for files and functions.
 *
 * @typedef {object} DescriptionMap
 * @property {Record<string, string>} files - The map of file paths to descriptions.
 * @property {Record<string, string>} functions - The map of function names to descriptions.
 */

/**
 * Function information.
 *
 * @typedef {object} FunctionInfo
 * @property {string} name - The name of the function.
 * @property {ParameterInfo[]} parameters - The parameters of the function.
 * @property {string | undefined} description - The description of the function.
 * @property {string | undefined} filePath - The path to the file containing the function.
 */

/**
 * Parameter information for a function.
 *
 * @typedef {object} ParameterInfo
 * @property {string} name - The name of the parameter.
 * @property {string} type - The type of the parameter.
 * @property {string | undefined} defaultValue - The default value of the parameter, if any.
 * @property {boolean} isOptional - Whether the parameter is optional.
 */
