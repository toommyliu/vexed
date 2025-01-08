const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const typeDefinitions = [];

/**
 * Formats a type string for markdown.
 * @param {string} type The type to create a link for.
 * @param {boolean} escape Whether to escape the pipe character, for use in markdown tables.
 */

function formatType(type, escape) {
	if (escape) type = type.replace(/\|/g, '\\|');
	return `\`${type}\``;
}

/**
 *
 * @param {string} tsconfigPath The path to the tsconfig file.
 * @returns {{compilerOptions: ts.CompilerOptions, fileNames: string[]}} The parsed tsconfig file and file names.
 */
function loadTsConfig(tsconfigPath) {
	const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
	if (configFile.error) {
		throw new Error(
			`Failed to load tsconfig: ${configFile.error.messageText}`,
		);
	}

	const parsedConfig = ts.parseJsonConfigFileContent(
		configFile.config,
		ts.sys,
		path.dirname(tsconfigPath),
	);

	if (parsedConfig.errors.length) {
		throw new Error(
			`Failed to parse tsconfig: ${parsedConfig.errors[0].messageText}`,
		);
	}

	return {
		compilerOptions: parsedConfig.options,
		fileNames: parsedConfig.fileNames.filter(
			(file) =>
				file.startsWith('src/renderer/game/api/') &&
				file.endsWith('.ts') &&
				!file.endsWith('.d.ts'),
		),
	};
}

function ensureDirectoryExists(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

/**
 * @param {ts.Declaration} node
 * @returns {boolean} Whether the node is being exported.
 */
function isNodeExported(node) {
	// Check if the node has an export modifier
	const hasExportModifier =
		(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;

	// Check if the node is directly in a source file (top-level declaration)
	const isTopLevel =
		node.parent && node.parent.kind === ts.SyntaxKind.SourceFile;

	// Check if the node is part of an export declaration
	const isExportDeclaration =
		node.parent &&
		(node.parent.kind === ts.SyntaxKind.ExportDeclaration ||
			node.parent.kind === ts.SyntaxKind.ExportAssignment);

	return hasExportModifier || isTopLevel || isExportDeclaration;
}

/**
 * Parses jsdoc content from a symbol.
 * @param {ts.Symbol} symbol
 * @param {ts.TypeChecker} typeChecker
 * @returns {string} The parsed jsdoc content.
 */
function getJsDocContent(symbol, typeChecker) {
	const documentation =
		ts.displayPartsToString(symbol.getDocumentationComment(typeChecker)) ||
		'';

	const jsDocNodes =
		symbol.declarations
			?.map((decl) => decl.jsDoc?.filter((doc) => doc.tags?.length > 0))
			.flat()
			.filter(Boolean) || [];

	let out = documentation;

	for (const node of jsDocNodes) {
		if (!node?.tags) return;

		// Parse @remarks tags
		const remarkTags = node.tags.filter(
			(tag) => tag.tagName.text === 'remarks',
		);
		for (const tag of remarkTags) {
			if (tag.comment) {
				const remarkText =
					typeof tag.comment === 'string'
						? tag.comment
						: ts.displayPartsToString(tag.comment);

				if (remarkText) {
					if (out) out += '\n\n';

					out += `**Remarks:** ${remarkText}`;
				}
			}
		}
	}

	return out;
}

/**
 * Gets the default value for a node.
 * @param {ts.Node} node - The node to get the default value of.
 * @returns {string|undefined} - The default value of the node.
 */
function getDefaultValue(node) {
	if (!node.initializer) return undefined;

	switch (node.initializer.kind) {
		case ts.SyntaxKind.StringLiteral:
			return `"${node.initializer.text}"`;
		case ts.SyntaxKind.NumericLiteral:
			return node.initializer.text;
		case ts.SyntaxKind.TrueKeyword:
			return 'true';
		case ts.SyntaxKind.FalseKeyword:
			return 'false';
		case ts.SyntaxKind.NullKeyword:
			return 'null';
		case ts.SyntaxKind.UndefinedKeyword:
			return 'undefined';
		case ts.SyntaxKind.ArrayLiteralExpression:
			return '[]';
		case ts.SyntaxKind.ObjectLiteralExpression:
			return '{}';
		default:
			return node.initializer.getText();
	}
}

function generateDocs(fileNames, options) {
	const program = ts.createProgram(fileNames, options);
	const checker = program.getTypeChecker();
	const documentation = new Map();

	for (const sourceFile of program.getSourceFiles()) {
		// Skip
		if (
			sourceFile.fileName.includes('node_modules') ||
			sourceFile.isDeclarationFile
		)
			continue;

		const fileDoc = {
			methods: [],
			properties: [],
			classes: [],
			interfaces: [],
			enums: [],
			fileName: path.basename(sourceFile.fileName, '.ts'),
			dir: path.dirname(sourceFile.fileName),
		};

		documentation.set(sourceFile.fileName, fileDoc);
		ts.forEachChild(sourceFile, (node) => visit(node, fileDoc));
	}

	return { documentation, typeDefinitions };

	function visit(node, fileDoc) {
		if (ts.isTypeAliasDeclaration(node)) {
			const typedef = serializeTypeDefinition(node);
			typeDefinitions.push(typedef);
			return;
		}

		if (ts.isEnumDeclaration(node)) {
			const enumDoc = serializeEnum(node);
			fileDoc.enums.push(enumDoc);
			return;
		}

		if (!isNodeExported(node)) return;

		if (ts.isFunctionDeclaration(node) && node.name) {
			const symbol = checker.getSymbolAtLocation(node.name);
			if (symbol) fileDoc.methods.push(serializeFunction(symbol));
		} else if (ts.isClassDeclaration(node) && node.name) {
			const symbol = checker.getSymbolAtLocation(node.name);
			if (symbol) {
				const classDoc = serializeClass(symbol);
				fileDoc.classes.push(classDoc);
			}
		} else if (ts.isPropertyDeclaration(node) && node.name) {
			const symbol = checker.getSymbolAtLocation(node.name);
			if (symbol) fileDoc.properties.push(serializeProperty(symbol));
		} else if (ts.isInterfaceDeclaration(node) && node.name) {
			const symbol = checker.getSymbolAtLocation(node.name);
			if (symbol) {
				const interfaceDoc = serializeInterface(symbol);
				fileDoc.interfaces.push(interfaceDoc);
			}
		}

		ts.forEachChild(node, (n) => visit(n, fileDoc));
	}

	/**
	 *
	 * @param {ts.Node} node
	 * @returns
	 */
	function serializeEnum(node) {
		const symbol = checker.getSymbolAtLocation(node.name);
		return {
			name: node.name.text,
			documentation: getJsDocContent(symbol, checker),
			members: node.members.map((member) => ({
				name: member.name.getText(),
				value: checker.getConstantValue(member),
				documentation: member.name
					? getJsDocContent(
							checker.getSymbolAtLocation(member.name),
							checker,
						)
					: '',
			})),
		};
	}

	function serializeTypeDefinition(node) {
		const symbol = checker.getSymbolAtLocation(node.name);
		const type = checker.getTypeAtLocation(node);
		let fields = [];

		if ((type.flags & ts.TypeFlags.Object) !== 0) {
			if (type.isUnion()) {
				return {
					name: node.name.text,
					documentation: getJsDocContent(symbol, checker),
					type: checker.typeToString(type),
					fields: [],
				};
			}

			const properties = type.getProperties();
			if (properties) {
				properties.forEach((prop) => {
					fields.push({
						name: prop.getName(),
						type: checker.typeToString(
							checker.getTypeOfSymbolAtLocation(
								prop,
								prop.valueDeclaration,
							),
						),
						documentation: getJsDocContent(prop, checker),
					});
				});
			}
		}

		return {
			name: node.name.text,
			documentation: getJsDocContent(symbol, checker),
			type: checker.typeToString(type),
			fields,
		};
	}

	function serializeFunction(symbol) {
		const details = {
			name: symbol.getName(),
			documentation: getJsDocContent(symbol, checker),
			parameters: [],
			returnType: '',
		};

		const type = checker.getTypeOfSymbolAtLocation(
			symbol,
			symbol.valueDeclaration,
		);
		const signatures = type.getCallSignatures();

		if (signatures.length) {
			const signature = signatures[0];
			const signatureDeclaration = signature.getDeclaration();

			details.parameters = signature.parameters.map((param, index) => {
				const paramDeclaration =
					signatureDeclaration?.parameters[index];
				const isOptional =
					paramDeclaration?.questionToken !== undefined ||
					paramDeclaration?.initializer !== undefined;
				const defaultValue = paramDeclaration
					? getDefaultValue(paramDeclaration)
					: undefined;

				return {
					name: param.getName(),
					documentation:
						ts.displayPartsToString(
							param.getDocumentationComment(checker),
						) || '',
					type: checker.typeToString(
						checker.getTypeOfSymbolAtLocation(
							param,
							param.valueDeclaration,
						),
					),
					isOptional,
					defaultValue,
				};
			});

			details.returnType = checker.typeToString(
				signature.getReturnType(),
			);
		}

		return details;
	}

	function serializeProperty(symbol) {
		return {
			name: symbol.getName(),
			documentation:
				ts.displayPartsToString(
					symbol.getDocumentationComment(checker),
				) || '',
			type: checker.typeToString(
				checker.getTypeOfSymbolAtLocation(
					symbol,
					symbol.valueDeclaration,
				),
			),
		};
	}

	function serializeClass(symbol) {
		const type = checker.getTypeOfSymbolAtLocation(
			symbol,
			symbol.valueDeclaration,
		);
		const details = {
			name: symbol.getName(),
			documentation:
				ts.displayPartsToString(
					symbol.getDocumentationComment(checker),
				) || '',
			methods: [],
			properties: [],
			accessors: [],
			events: [],
		};

		function serializeEvent(symbol, declaration) {
			const details = {
				name: symbol.getName(),
				documentation: getJsDocContent(symbol, checker),
				type: checker.typeToString(
					checker.getTypeOfSymbolAtLocation(
						symbol,
						symbol.valueDeclaration,
					),
				),
			};
			return details;
		}

		function serializeAccessor(symbol, declaration) {
			const details = {
				name: symbol.getName(),
				documentation: getJsDocContent(symbol, checker),
				type: '',
			};

			if (ts.isGetAccessor(declaration)) {
				const signature =
					checker.getSignatureFromDeclaration(declaration);
				details.type = checker.typeToString(signature?.getReturnType());
			} else if (ts.isSetAccessor(declaration)) {
				const parameter = declaration.parameters[0];
				if (parameter) {
					details.type = checker.typeToString(
						checker.getTypeAtLocation(parameter),
					);
				}
			}

			return details;
		}

		symbol.members?.forEach((member, key) => {
			const declarations = member.declarations;
			if (!declarations || declarations.length === 0) return;

			const declaration = declarations[0];

			const isEvent = declaration.jsDoc?.some((doc) =>
				doc.tags?.some((tag) => tag.tagName.text === 'eventProperty'),
			);

			if (isEvent) {
				details.events.push(serializeEvent(member, declaration));
			} else if (
				ts.isGetAccessor(declaration) ||
				ts.isSetAccessor(declaration)
			) {
				const accessorDetails = serializeAccessor(member, declaration);

				let existingAccessor = details.accessors.find(
					(a) => a.name === accessorDetails.name,
				);

				if (!existingAccessor) {
					existingAccessor = {
						name: accessorDetails.name,
						documentation: accessorDetails.documentation,
						badges: [],
						type: accessorDetails.type,
						cleanType: accessorDetails.type
							.replaceAll('(', '')
							.replaceAll(')', '')
							.replaceAll('[', '')
							.replaceAll(']', ''),
						getter: false,
						setter: false,
					};

					// Hacky fix for it to recognize get and set accessors as the same
					// The documentation includes both for getter and setter
					if (
						existingAccessor.documentation.includes('\n') &&
						!existingAccessor.documentation.includes('**Remarks:**')
					) {
						existingAccessor.getter =
							existingAccessor.setter = true;
					}

					details.accessors.push(existingAccessor);
				}

				if (ts.isGetAccessor(declaration)) {
					existingAccessor.getter = true;
					existingAccessor.type = accessorDetails.type;
					existingAccessor.cleanType = accessorDetails.type
						.replaceAll('(', '')
						.replaceAll(')', '')
						.replaceAll('[', '')
						.replaceAll(']', '');
				} else if (ts.isSetAccessor(declaration)) {
					existingAccessor.setter = true;
				}
			} else if (member.flags & ts.SymbolFlags.Method) {
				if (
					member.getName().startsWith('#') ||
					member.valueDeclaration?.modifiers?.some(
						(m) => m.kind === ts.SyntaxKind.PrivateKeyword,
					)
				)
					return;
				details.methods.push(serializeFunction(member));
			} else if (member.flags & ts.SymbolFlags.Property) {
				if (
					member.getName().startsWith('#') ||
					member.valueDeclaration?.modifiers?.some(
						(m) => m.kind === ts.SyntaxKind.PrivateKeyword,
					)
				)
					return;
				details.properties.push(serializeProperty(member));
			}
		});

		return details;
	}
}

function generateMarkdown(documentation, typeDefinitions) {
	const docsDir = '../docs/api';
	const structsDir = path.join(docsDir, 'structs');
	const utilDir = path.join(docsDir, 'util');
	const typedefsDir = path.join(docsDir, 'typedefs');
	const enumsDir = path.join(docsDir, 'enums');

	// fs.rmdirSync(docsDir, { recursive: true });

	ensureDirectoryExists(docsDir);
	ensureDirectoryExists(structsDir);
	ensureDirectoryExists(typedefsDir);
	ensureDirectoryExists(utilDir);
	ensureDirectoryExists(enumsDir);

	documentation.forEach((fileDoc) => {
		fileDoc.enums.forEach((enumDoc) => {
			let content = `# ${enumDoc.name}\n\n`;
			content += enumDoc.documentation
				? `${enumDoc.documentation}\n\n`
				: '';

			content += '| Name | Value | Description |\n';
			content += '|------|-------|-------------|\n';
			enumDoc.members.forEach((member) => {
				content += `| \`${member.name}\` | \`${member.value}\` | ${member.documentation || ''} |\n`;
			});
			content += '\n';

			fs.writeFileSync(
				path.join(enumsDir, `${enumDoc.name}.md`),
				content,
			);
		});
	});

	typeDefinitions.forEach((typedef) => {
		let content = `# ${typedef.name}\n\n${typedef.documentation}\n\n`;

		content += '```typescript\n';
		content += `type ${typedef.name} = ${typedef.type}\n`;
		content += '```\n\n';

		if (typedef.fields.length > 0) {
			content += '## Fields\n\n';
			content += '| Name | Type | Description |\n';
			content += '|------|------|-------------|\n';
			typedef.fields.forEach((field) => {
				content += `| \`${field.name}\` | ${formatType(field.type, true)} | ${field.documentation || ''} |\n`;
			});
		}

		fs.writeFileSync(path.join(typedefsDir, `${typedef.name}.md`), content);
	});
	documentation.forEach((fileDoc, fileName) => {
		let content = `---\noutline: deep\n---\n\n`;

		fileDoc.classes.forEach((classDoc) => {
			content += `# ${classDoc.name}\n\n`;
			content += classDoc.documentation
				? `${classDoc.documentation}\n\n`
				: '';
			content += '---\n\n';

			if (classDoc.events.length > 0) {
				content += '### Events\n\n';
				classDoc.events.forEach((event) => {
					content += `#### ${event.name}\n\n`;
					content += event.documentation
						? `${event.documentation}\n\n`
						: '';
					content += `Type: ${formatType(event.type, false)}\n\n`;
				});
			}

			if (
				classDoc.properties.length > 0 ||
				classDoc.accessors.length > 0
			) {
				content += '### Properties\n\n';

				classDoc.properties.forEach((prop) => {
					content += `#### ${prop.name}\n\n`;
					content += `Type: ${formatType(prop.type, false)}\n\n`;
					content += prop.documentation
						? `${prop.documentation}\n\n`
						: '';
				});

				classDoc.accessors.forEach((accessor) => {
					content += `#### ${accessor.name}\n\n`;

					if (accessor.getter && accessor.setter) {
						const lines = accessor.documentation.split('\n');

						content += `​<Badge type="info">getter</Badge>${lines[0]}\n\n`;
						content += `​<Badge type="info">setter</Badge>${lines[1]}\n\n`;
					} else if (accessor.getter || accessor.setter) {
						const badgeType = accessor.getter ? 'getter' : 'setter';
						content += `​<Badge type="info">${badgeType}</Badge>${accessor.documentation}\n\n`;
					} else {
						content += `${accessor.documentation}\n\n`;
					}

					content += `Type: ${formatType(accessor.type, false)}\n\n`;
				});
			}

			if (classDoc.methods.length > 0) {
				content += '### Methods\n\n';

				classDoc.methods.forEach((method) => {
					const returnTypeStr = formatType(method.returnType, false);

					content += `#### ${method.name}\n\n`;
					content += method.documentation
						? `${method.documentation}\n\n`
						: '';

					if (method.parameters.length > 0) {
						const hasOptionalParams = method.parameters.some(
							(param) => param.isOptional,
						);
						const hasDefaultParams = method.parameters.some(
							(param) => param.defaultValue,
						);

						if (hasOptionalParams || hasDefaultParams) {
							content += '**Parameters:**\n\n';
							content +=
								'| Name | Type | Optional | Default | Description |\n';
							content +=
								'|------|------|----------|---------|-------------|\n';
							method.parameters.forEach((param) => {
								const description =
									param.documentation.startsWith('-')
										? param.documentation.substring(2)
										: param.documentation;
								content += `| \`${param.name}\` | ${formatType(param.type, true)} | ${param.isOptional ? '✓' : ''} | ${param.defaultValue ? `\`${param.defaultValue}\`` : ''} | ${description} |\n`;
							});
						} else {
							content += '**Parameters:**\n\n';
							content += '| Name | Type | Description |\n';
							content += '|------|------|-------------|\n';
							method.parameters.forEach((param) => {
								const description =
									param.documentation.startsWith('-')
										? param.documentation.substring(2)
										: param.documentation;
								content += `| \`${param.name}\` | ${formatType(param.type, true)} | ${description} |\n`;
							});
						}
						content += '\n';
					}

					content += `**Returns:** ${returnTypeStr}\n\n`;
				});
			}

			const outputPath = fileDoc.dir.endsWith('/struct')
				? path.join(structsDir, `${fileDoc.fileName}.md`)
				: fileDoc.dir.endsWith('/util')
					? path.join(utilDir, `${fileDoc.fileName}.md`)
					: path.join(
							docsDir,
							`${path.basename(fileName, '.ts')}.md`,
						);

			fs.writeFileSync(outputPath, content);
		});
	});
}

async function docgen() {
	const { compilerOptions, fileNames } = loadTsConfig('./tsconfig.json');

	const { documentation, typeDefinitions } = generateDocs(
		fileNames,
		compilerOptions,
	);

	generateMarkdown(documentation, typeDefinitions);

	console.log('Documentation generated successfully!');
	console.log(`Processed ${fileNames.length} files`);
	console.log(`Generated ${documentation.size} API documentation files`);
	console.log(`Generated ${typeDefinitions.length} type definition files`);
}

try {
	docgen();
} catch (error) {
	console.log('error', error);
}
