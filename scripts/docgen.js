/* eslint-disable n/no-sync */
const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const ts = require('typescript');

/**
 * Makes a NOTE alert with the given lines.
 *
 * @param {string[]} lines
 * @returns {string} The formatted note alert.
 */
const makeNoteAlert = (lines) =>
  `> [!NOTE]\n${lines.map((str) => `> ${str}`).join('\n')}\n`;

/**
 * Map of function names to type replacements for their parameters.
 *
 * @type {TypeReplacementMap}
 */
const typeReplacements = {
  kill: {
    'Partial<KillOptions>': 'KillOptions',
  },
  kill_for_item: {
    'Partial<KillOptions>': 'KillOptions',
  },
  kill_for_temp_item: {
    'Partial<KillOptions>': 'KillOptions',
  },
};

/**
 * Map of descriptions for files and functions.
 *
 * @type {DescriptionMap}
 */
const descriptions = {
  files: {
    './src/renderer/game/botting/commands/combat/index.ts': makeNoteAlert([
      '- `target` refers to monster name or in the format "id:monMapId" (where `:` can be replaced with any of these delimiters: `\'` `.` `-` )',
      '   - Example formats: `id.1` (left orb) | `id:3` (right orb)',
      '- `item` can be name or id',
    ]),
  },
  functions: {
    'cmd.kill': makeNoteAlert([
      '[KillOptions](/api-legacy/typedefs/KillOptions)',
    ]),
    'cmd.kill_for_item': makeNoteAlert([
      '[KillOptions](/api-legacy/typedefs/KillOptions)',
    ]),
    'cmd.kill_for_temp_item': makeNoteAlert([
      '[KillOptions](/api-legacy/typedefs/KillOptions)',
    ]),
    'cmd.register_drop': makeNoteAlert([
      'drops should be registered as soon as possible and must be the full name of the drop.',
    ]),
    'cmd.register_boost': makeNoteAlert([
      'Boosts should be registered as soon as possible and must be the full name of the boost.',
    ]),
    'cmd.unregister_boost': makeNoteAlert([
      'Boosts should be registered as soon as possible and must be the full name of the boost.',
    ]),
    'cmd.set_spawn': makeNoteAlert([
      'Sets the player spawnpoint to the current cell if no arguments are provided.',
    ]),
    'cmd.delay': makeNoteAlert(['delay is in ms']),
    'cmd.set_delay': makeNoteAlert(['delay is in ms']),
    'cmd.wait_for_player_count': makeNoteAlert(['wait for map player count']),
    'cmd.enable_anticounter': makeNoteAlert([
      'Enables the anti-counter handler when a "prepares a counter attack" message is detected, which stops attacking until the counter attack ends.',
    ]),
    'cmd.goto_house': makeNoteAlert([
      'If no player is provided, it will go to your house.',
    ]),
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
  // Try exact match first
  if (descriptions.files[filePath]) {
    return descriptions.files[filePath];
  }

  // Try partial matching
  const fileName = path.basename(filePath);
  if (descriptions.files[fileName]) {
    return descriptions.files[fileName];
  }

  // Find any partial matches in the file path
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
  const code = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    'temp.ts',
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
      let paramType = param.type ? param.type.getText(sourceFile) : 'any';

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
    throw new Error('Only files are supported');
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

    markdown += `\`\`\`ts\n`;
    markdown += `cmd.${fn.name}(`;

    // Make params string
    for (let index = 0; index < fn.parameters.length; index++) {
      const param = fn.parameters[index];
      markdown += `${param.name}: ${param.type}`;
      if (param.defaultValue) {
        markdown += ` = ${param.defaultValue}`;
      }

      if (index < fn.parameters.length - 1) {
        markdown += ', ';
      }
    }

    markdown += `)\n`;
    markdown += `\`\`\`\n\n`;

    if (fn.description) {
      markdown += `${fn.description}\n\n`;
    }
  }

  fs.writeFileSync(outputPath, markdown);
  console.log(`Documentation saved to ${outputPath}`);
}

async function generateDocs() {
  const BASEDIR = path.join(__dirname, '../src/renderer/game/botting/commands');

  // Get all names of the directories in the commands folder

  const directories = fs
    .readdirSync(BASEDIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const dir of directories) {
    const inputPath = path.join(BASEDIR, dir, 'index.ts');
    const outputPath = path.join(__dirname, `../docs/api/${dir}.md`);
    generateMarkdown(inputPath, outputPath);
  }
}

// eslint-disable-next-line promise/prefer-await-to-callbacks
generateDocs().catch((error) => {
  console.error('Error generating documentation', error);
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
