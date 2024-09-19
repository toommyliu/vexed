// https://github.com/Elfsquad/tsdoc-parser/blob/main/src/parser.ts
const {
	DocCodeSpan,
	DocErrorText,
	DocPlainText,
	DocSoftBreak,
	TSDocParser,
} = require('@microsoft/tsdoc');

const ts = require('typescript');

const fs = require('fs');
const readdir = fs.promises.readdir;

const path = require('path');
const { join } = path;

const sectionToMarkdown = (section) => {
	if (!section) {
		throw new Error('No description found');
	}

	if (section.nodes.length === 0) {
		return '';
	}

	const nodes = section.nodes[0].getChildNodes();
	let ret = '';
	for (const node of nodes) {
		if (node instanceof DocPlainText) {
			ret += node.text;
		} else if (node instanceof DocSoftBreak) {
			ret += ' ';
		} else if (node instanceof DocCodeSpan) {
			ret += '`' + node.code + '`';
		} else if (node instanceof DocErrorText) {
			ret += node.text;
		} else {
			console.log(node);
			throw new Error(`Unexpected node type: ${node.kind}`);
		}
	}

	return ret.trim();
};

const getTypeName = (type) => {
	if (!type) return 'unknown';

	const kindTypeMap = {
		[ts.SyntaxKind.StringKeyword]: 'string',
		[ts.SyntaxKind.NumberKeyword]: 'number',
		[ts.SyntaxKind.BooleanKeyword]: 'boolean',
		[ts.SyntaxKind.VoidKeyword]: 'void',
		[ts.SyntaxKind.UndefinedKeyword]: 'undefined',
		[ts.SyntaxKind.NullKeyword]: 'null',
		[ts.SyntaxKind.AnyKeyword]: 'any',
		[ts.SyntaxKind.UnknownKeyword]: 'unknown',
		[ts.SyntaxKind.NeverKeyword]: 'never',
		[ts.SyntaxKind.ObjectKeyword]: 'object',
	};

	if (kindTypeMap[type.kind]) return kindTypeMap[type.kind];

	if (!type) return 'unknown';

	if (ts.isTypeReferenceNode(type)) return type.typeName.getText();

	if (ts.isUnionTypeNode(type))
		return type.types.map((t) => getTypeName(t)).join(' | ');

	if (ts.isParenthesizedTypeNode(type)) return getTypeName(type.type);

	if (ts.isFunctionTypeNode(type)) {
		const params = type.parameters.map(
			(p) => `${p.name.getText()}: ${getTypeName(p.type)}`,
		);
		const returnType = getTypeName(type.type);
		return `(${params.join(', ')}) => ${returnType}`;
	}

	if (ts.isTypeLiteralNode(type)) return 'object';

	if (ts.isArrayTypeNode(type)) return getTypeName(type.elementType) + '[]';

	if (ts.isLiteralTypeNode(type)) {
		return type.literal.getText();
	}

	console.error(`Unknown type: ${type.kind}`);
};

const convertParamDeclaration = (param, comment, typeToParametersMap) => {
	const paramName = param.name.getText();
	const paramType = getTypeName(param.type);
	const paramDoc = comment
		? comment.params.blocks.find(
				(block) => block.parameterName === paramName,
			)
		: null;
	const parameters = typeToParametersMap.get(paramType) || [];

	return {
		name: paramName,
		type: paramType,
		description: paramDoc ? sectionToMarkdown(paramDoc.content) : '',
		required: !param.questionToken,
		parameters: parameters,
	};
};

const getLocalImports = (sourceFile) => {
	const result = [];

	const visit = (node) => {
		if (!ts.isImportDeclaration(node)) return ts.forEachChild(node, visit);

		const moduleSpecifier = node.moduleSpecifier.getText();
		if (
			!moduleSpecifier.startsWith('".') &&
			!moduleSpecifier.startsWith("'.") &&
			!moduleSpecifier.startsWith('`.')
		) {
			return;
		}

		const importPath = moduleSpecifier.substring(
			1,
			moduleSpecifier.length - 1,
		);
		const dirName = sourceFile.fileName.substring(
			0,
			sourceFile.fileName.lastIndexOf('/'),
		);
		const importFileName = dirName + '/' + importPath + '.ts';
		if (!fs.existsSync(importFileName)) {
			console.error(`File in import (${importFileName}) does not exist`);
			return;
		}

		const importFileContents = fs.readFileSync(importFileName, 'utf8');
		const importSourceFile = ts.createSourceFile(
			importFileName,
			importFileContents,
			ts.ScriptTarget.ES2015,
			true,
		);
		result.push(importSourceFile);
	};

	ts.forEachChild(sourceFile, visit);
	return result;
};

const getTypesToParametersMap = (fileName) => {
	const result = new Map();

	const fileContents = fs.readFileSync(fileName, 'utf8');
	const sourceFile = ts.createSourceFile(
		fileName,
		fileContents,
		ts.ScriptTarget.ES2015,
		true,
	);
	const sourceFiles = [sourceFile, ...getLocalImports(sourceFile)];

	const visit = (node) => {
		if (!ts.isInterfaceDeclaration(node))
			return ts.forEachChild(node, visit);

		const interfaceName = node.name.getText();
		const members = node.members.filter((m) => ts.isPropertySignature(m));
		if (members.length === 0) return;

		const fileContent = node.getSourceFile().text;
		const properties = members.map((m) => {
			const commentRanges = ts.getLeadingCommentRanges(
				fileContent,
				m.pos,
			);
			const commentStr = commentRanges
				? fileContent.substring(
						commentRanges[0].pos,
						commentRanges[0].end,
					)
				: '';
			const comment = new TSDocParser().parseString(
				commentStr,
			).docComment;

			const name = m.name.getText();
			const description = comment.summarySection
				? sectionToMarkdown(comment.summarySection)
				: '';
			const type = m.type ? getTypeName(m.type) : 'unknown';

			const required = !m.questionToken;
			return { name, type, description, required };
		});

		result.set(interfaceName, properties);
	};

	for (const file of sourceFiles) {
		ts.forEachChild(file, visit);
	}

	return result;
};

const getComment = (node, sourceFile, parser) => {
	const commentRanges = ts.getLeadingCommentRanges(sourceFile.text, node.pos);
	if (!commentRanges) return null;

	const commentStr = sourceFile.text.substring(
		commentRanges[0].pos,
		commentRanges[0].end,
	);
	return parser.parseString(commentStr).docComment;
};

const parseTypeScriptFile = (fileName, className) => {
	const typeToParametersMap = getTypesToParametersMap(fileName);

	const fileContents = fs.readFileSync(fileName, 'utf8');
	const sourceFile = ts.createSourceFile(
		fileName,
		fileContents,
		ts.ScriptTarget.ES2015,
		true,
	);

	const parser = new TSDocParser();
	const results = [];

	const visit = (node) => {
		if (
			!ts.isMethodDeclaration(node) &&
			!ts.isPropertyDeclaration(
				node,
			) /* property declaration within the class */ &&
			!ts.isGetAccessorDeclaration(node) &&
			!ts.isSetAccessorDeclaration(node)
		) {
			return ts.forEachChild(node, visit);
		}

		const parent = node.parent;
		if (
			className !== undefined &&
			(!parent ||
				!ts.isClassDeclaration(parent) ||
				parent.name.getText() !== className)
		)
			return ts.forEachChild(node, visit);

		const excludedModifiers = [
			ts.SyntaxKind.PrivateKeyword,
			ts.SyntaxKind.ProtectedKeyword,
		];

		if (
			node.modifiers &&
			node.modifiers.some((mod) => excludedModifiers.includes(mod.kind))
		)
			return ts.forEachChild(node, visit);

		const comment = getComment(node, sourceFile, parser);

		if (ts.isMethodDeclaration(node)) {
			const name = node.name ? node.name.getText(sourceFile) : null;

			if (name.startsWith('#')) {
				return;
			}

			const description = comment
				? sectionToMarkdown(comment.summarySection)
				: '';

			const parameters = node.parameters.map((p) =>
				convertParamDeclaration(p, comment, typeToParametersMap),
			);

			const returnType = node.type
				? node.type.getText(sourceFile)
				: 'void';
			const returnDescription = comment?.returnsBlock
				? sectionToMarkdown(comment.returnsBlock.content)
				: '';

			results.push({
				type: 'method',
				name,
				description,
				parameters,
				returns: {
					type: returnType,
					description: returnDescription,
				},
			});
		} else if (ts.isPropertyDeclaration(node)) {
			const name = node.name.getText(sourceFile);
			// #prop are private
			if (name.startsWith('#')) {
				return;
			}

			const ret = {
				type: 'property',
				name,
				description: comment
					? sectionToMarkdown(comment.summarySection)
					: '',
				type: node.type ? node.type.getText(sourceFile) : 'unknown',
			};

			// console.log(ret);
			results.push(ret);
		} else if (
			ts.isGetAccessorDeclaration(node) ||
			ts.isSetAccessorDeclaration(node)
		) {
			const isGetter = ts.isGetAccessorDeclaration(node);
			const isSetter = ts.isSetAccessorDeclaration(node);

			if (isGetter) {
				// console.log(`getter ${node.name.getText(sourceFile)}`);
			}

			if (isSetter) {
				// console.log(`setter ${node.name.getText(sourceFile)}`);
			}
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);

	return results;
};

const inputDir = join(__dirname, '../src/renderer/api');
const outputDir = join(__dirname, '../../docs/api');

const readdirp = async (dir) => {
	const dirents = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		dirents.map((dirent) => {
			const res = join(dir, dirent.name);
			return dirent.isDirectory() ? readdirp(res) : res;
		}),
	);
	return Array.prototype.concat(...files);
};

const docgen = async () => {
	/**
	 * @type {string[]}
	 */
	const files = await readdirp(inputDir);

	for (const file of files) {
		const cls = path.basename(file, '.ts');
		const md = ['---', `title: ${cls}`, 'outline: deep', '---'];

		const out = parseTypeScriptFile(file);

		const methods = out.filter((block) => block.type === 'method');
		const properties = out.filter((block) => block.type === 'property');

		// TODO:
		const propertiesMd = properties.map((block) => {
			const name = block.name;
			const description = block.description;
			return `
### ${name}
${description}
	`;
		});

		const methodsMd = methods.map((block) => {
			const name = block.name;
			const description = block.description;
			const params = block.parameters;

			const str = `### ${name}
${description}
${params.length > 0 ? `| Parameter | Type | Description |\n| --------- | ---- | ----------- |\n` : ''}${params
				.map(
					(param) =>
						`| ${param.name} | ${param.type} | ${param.description} |\n`,
				)
				.join('')}`;

			return str;
		});

		const outMd = [...md];
		if (propertiesMd.length > 0) {
			outMd.push('## Properties');
			outMd.push(...propertiesMd);
		}

		if (methodsMd.length > 0) {
			outMd.push('## Methods');
			outMd.push(...methodsMd);
		}

		await fs.promises.writeFile(
			path.join(outputDir, `${cls}.md`),
			outMd.join('\n'),
		);
	}
};

const start = performance.now();
docgen()
	.then(() => {
		console.log(`Took ${(performance.now() - start).toFixed(2)}ms`);
	})
	.catch((err) => {
		// An error will throw if it tries to parse a jsdoc block instead of tsdoc
		console.log(`An error occured during docgen: ${err}`);
	});
