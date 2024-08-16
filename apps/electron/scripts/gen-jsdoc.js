const doc = require('doxxx');

const fs = require('fs-extra');
const readdir = require('fs').promises.readdir;

const { join, resolve, dirname, basename } = require('node:path');
const { inspect } = require('node:util');

let currentFile = null;

doc.contextPatternMatchers.push(function (str, parentContext) {
	// Matches async class methods
	if (/^\s*async\s+([\w$]+)\s*\(/.exec(str)) {
		return {
			type: 'method',
			constructor: parentContext.name,
			cons: parentContext.name,
			name: RegExp.$1,
			text:
				(parentContext && parentContext.name
					? parentContext.name + '.prototype.'
					: '') +
				RegExp.$1 +
				'()',
		};
	}
});

const inputDir = join(__dirname, '../src/renderer/game/botting/api');
const outputDir = join(__dirname, '../../docs/api');

const typePatterns = [
	{
		regex: /^(\?)?boolean(\[\])?$/,
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean',
	},
	{
		regex: /^(\?)?number(\[\])?$/,
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number',
	},
	{
		regex: /^(\?)?string(\[\])?$/,
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
	},
	{
		regex: /^(\?)?Promise(\[\])?$/,
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
	},
	{
		regex: /^(\?)?Function(\[\])?$/,
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function',
	},
	{ regex: /^(\?)?Bot(\[\])?$/, url: '/api/bot' },
	{ regex: /^(\?)?Server(\[\])?$/, url: '/api/struct/server' },
	{ regex: /^(\?)?Avatar(\[\])?$/, url: '/api/struct/avatar' },
	{ regex: /^(\?)?Faction(\[\])?$/, url: '/api/struct/faction' },
	{ regex: /^(\?)?Item(\[\])?$/, url: '/api/struct/item' },
	{ regex: /^(\?)?BankItem(\[\])?$/, url: '/api/struct/bankitem' },
	{ regex: /^(\?)?HouseItem(\[\])?$/, url: '/api/struct/houseitem' },
	{ regex: /^(\?)?InventoryItem(\[\])?$/, url: '/api/struct/inventoryitem' },
	{
		regex: /^(\?)?TempInventoryItem(\[\])?$/,
		url: '/api/struct/tempinventoryitem',
	},
	{ regex: /^(\?)?Monster(\[\])?$/, url: '/api/struct/monster' },
	{ regex: /^(\?)?Quest(\[\])?$/, url: '/api/struct/quest' },
	{ regex: /^(\?)?PlayerState(\[\])?$/, url: '/api/enums/playerstate' },
	{ regex: /^(\?)?GameAction(\[\])?$/, url: '/api/enums/gameaction' },
	{ regex: /^(\?)?AvatarData(\[\])?$/, url: '/api/typedefs/avatardata' },
	{ regex: /^(\?)?MonsterData(\[\])?$/, url: '/api/typedefs/monsterdata' },
	{ regex: /^(\?)?FactionData(\[\])?$/, url: '/api/typedefs/factiondata' },
	{ regex: /^(\?)?ServerData(\[\])?$/, url: '/api/typedefs/serverdata' },
	{ regex: /^(\?)?ShopInfo(\[\])?$/, url: '/api/typedefs/shopinfo' },
	{ regex: /^(\?)?ItemData(\[\])?$/, url: '/api/struct/item' },
	{ regex: /KillConfig/, url: '/api/typedefs/killconfig' },
];

/**
 * Gets the doc link for a type
 * @param {string} type The type
 * @returns {string} The url to the type if it exists
 */
const getTypeLink = (type) => {
	// import()
	if (type.startsWith('import(')) {
		const match = type.match(/import\(['"](.*)['"]\)(?:\.(\w+))?(\[\])?$/);
		if (match) {
			const [, path, specificType] = match;
			if (!specificType) {
				// default import
				const moduleName = path.split('/').pop();
				return `/api/${moduleName.toLowerCase()}`;
			}
			type = specificType + (match[3] || '');
		}
	}

	// promise<void>
	const genericMatch = type.match(/^(\w+)<(.+)>$/);
	if (genericMatch) {
		const [, genericType] = genericMatch;
		type = genericType;
	}

	// remove array notation
	if (type.endsWith('[]')) {
		type = type.slice(0, -2);
	}

	for (const { regex, url } of typePatterns) {
		if (regex.test(type)) {
			return url.toLowerCase();
		}
	}
	return null;
};

/**
 * @param {string} type The type from the block
 * @returns {string} Returns the link as an anchor tag, or code block if it doesn't exist
 */
const getTypeString = (type) => {
	if (type.startsWith('import(')) {
		const match = type.match(/import\(['"](.*)['"]\)(?:\.(\w+))?(\[\])?$/);
		if (match) {
			const [, path, specificType, arrayNotation] = match;
			const moduleName = path.split('/').pop();
			if (!specificType) {
				const url = `/api/${moduleName.toLowerCase()}`;
				return `<code><a href="${url}">${moduleName}</a>${arrayNotation || ''}</code>`;
			}
			type = `${moduleName}.${specificType}${arrayNotation || ''}`;
		}
	}

	const genericMatch = type.match(/^(\w+)<(.+)>$/);
	if (genericMatch) {
		const [, genericType, innerType] = genericMatch;
		const genericTypeLink = getTypeLink(genericType);
		if (genericTypeLink) {
			return `<code><a href="${genericTypeLink}">${genericType}</a>&lt;${innerType}&gt;</code>`;
		}
		return `<code>${type}</code>`;
	}

	if (type.endsWith('[]')) {
		const baseType = type.slice(0, -2);
		const baseTypeLink = getTypeLink(baseType);
		if (baseTypeLink) {
			return `<code><a href="${baseTypeLink}">${baseType}</a>[]</code>`;
		}
		return '`' + type + '`';
	}

	if (type.includes('|')) {
		const unionTypes = type.split('|').map((t) => t.trim());
		const linkedUnionTypes = unionTypes.map((t) => {
			const typeURL = getTypeLink(t);
			return typeURL ? `<a href="${typeURL}">${t}</a>` : t;
		});
		return '<code>' + linkedUnionTypes.join(' | ') + '</code>';
	}

	let isOptional = false;
	if (type.startsWith('?')) {
		isOptional = true;
		type = type.slice(1);
	}

	const typeURL = getTypeLink(type);
	if (typeURL) {
		const linkedType = `<a href="${typeURL}">${type}</a>`;
		return `<code>${isOptional ? '?' : ''}${linkedType}</code>`;
	}
	return '`' + (isOptional ? '?' : '') + type + '`';
};

async function parseForJSDoc() {
	console.log('Cleaning output directory...');

	const readdirp = async (dir) => {
		const dirents = await readdir(dir, { withFileTypes: true });
		const files = await Promise.all(
			dirents.map((dirent) => {
				const res = resolve(dir, dirent.name);
				return dirent.isDirectory() ? readdirp(res) : res;
			}),
		);
		return Array.prototype.concat(...files);
	};

	// clean old artifacts
	for (const file of await readdirp(outputDir)) {
		if (file.includes('examples')) {
			continue;
		}
		await fs.rm(file);
	}

	const inputs = await readdirp(inputDir);
	console.log(`Found ${inputs.length} files to parse...`);

	const enums = {};
	const typedefs = {};

	for (const file of inputs) {
		const input = { path: dirname(file), name: basename(file) };
		currentFile = input.name;

		const path = join(input.path, currentFile);
		const code = await fs.readFile(path, 'utf-8');
		const ast = doc.parseComments(code);

		if (ast.length === 0) {
			console.warn(
				`No jsdoc comments found within ${currentFile}, skipping...`,
			);
			continue;
		}

		const title = input.name.split('.')[0];

		const md = ['---', `title: ${title}`, 'outline: deep', '---'];

		const props = [];
		const methods = [];

		console.log(`Parsing ${currentFile} now`);

		md.push(`# ${title}`);
		md.push('');

		// Is this class/type documented?
		const isClass = ast[0]?.ctx?.type === 'class';
		const isType = ast[0]?.tags?.[0]?.tagType === 'type';
		if (isClass || isType) {
			const _extends = ast[0].ctx.extends; // the extended class name
			if (isClass && _extends !== '') {
				const extendedClass = _extends;
				const typeURL = getTypeLink(extendedClass);
				const returnTypeStr = typeURL
					? `<a href="${typeURL}">${extendedClass}</a>`
					: extendedClass;
				md[md.length - 2] += `<Badge>extends ${returnTypeStr}</Badge>`;
			}

			for (const line of ast[0].description.summary.split('\n')) {
				md.push(line);
				md.push('');
				md.push('');
			}
		}

		for (let i = 0; i < ast.length; i++) {
			const obj = ast[i];

			const skip =
				// prettier-ignore
				obj?.tags?.some((t) => t.tagType === 'private') /* @private */ ||
				obj?.tags?.some((t) => t.tagType === 'ignore'); /* @ignore */

			if (skip) {
				continue;
			}

			// #region typedef
			// typedef
			if (obj?.tags?.[0]?.tagType === 'typedef') {
				const typedefName = obj.type;
				if (typedefName === 'KillConfig') {
					console.log(obj);
				}
				typedefs[typedefName] = [
					'---',
					'outline: deep',
					'---',
					'',
					`# ${typedefName}`,
					'',
					'Type: [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)',
					obj.description.summary,
					'',
					'## Properties',
				];

				const typedef = typedefs[typedefName];

				const hasOptionalProps = obj.tags.some((t) => t.isOptional);
				const hasDefaultValues = obj.tags.some(
					(t) => t.isOptional && t.defaultValue,
				);

				if (hasDefaultValues) {
					typedef.push(
						'| Property | Type | Optional | Default | Description |',
					);
					typedef.push(
						'| -------- | ---- | -------- | ------- | ----------- |',
					);
				} else if (hasOptionalProps) {
					typedef.push(
						'| Property | Type | Optional | Description |',
					);
					typedef.push(
						'| -------- | ---- | -------- | ----------- |',
					);
				} else {
					typedef.push('| Property | Type | Description |');
					typedef.push('| -------- | ---- | ----------- |');
				}

				for (let j = 1; j < obj.tags.length; j++) {
					const tag = obj.tags[j];

					const p_name = tag.name;
					const p_type_og = tag.type.trim();
					let p_type = p_type_og;
					if (p_type_og.includes('|')) {
						p_type = p_type_og
							.split('|')
							.map((t) => getTypeString(t.trim()))
							.join('\\|');
					} else {
						p_type = getTypeString(p_type_og);
					}
					const p_optional = tag.isOptional;
					let p_defaultValue =
						Array.isArray(tag.defaultValue) &&
						tag.defaultValue.length === 0
							? '[]'
							: tag.defaultValue ?? '';
					if (
						hasDefaultValues &&
						tag.defaultValue?.length > 0 &&
						tag.type === 'string'
					) {
						p_defaultValue = `"${p_defaultValue}"`;
					}
					const p_description = tag.description ?? '';

					if (hasDefaultValues) {
						typedef.push(
							`| ${p_name} | ${p_type} | ${p_optional ? '✅' : ''} | ${p_defaultValue} | ${p_description} |`,
						);
					} else if (hasOptionalProps) {
						typedef.push(
							`| ${p_name} | ${p_type} | ${p_optional ? '✅' : ''} | ${p_description} |`,
						);
					} else {
						typedef.push(
							`| ${p_name} | ${p_type} | ${p_description} |`,
						);
					}
				}
			}
			//#endregion

			//#region enum
			// enum declaration
			if (obj?.tags?.some((t) => t.tagType === 'enum')) {
				const enumName = obj?.ctx?.name;
				enums[enumName] = [
					'---',
					'outline: deep',
					'---',
					'',
					'',
					`# ${enumName}`,
					'',
					obj.description.summary,
					'',
					'',
					'## Members',
				];
			}
			// enum members
			if (obj?.tags?.[0]?.tagType === 'memberof') {
				const memberOf = obj.tags[0].tagValue;
				const entry = enums[memberOf];
				entry.push(`### ${obj.ctx.name}`);
				entry.push(
					`\`${memberOf}.${obj.ctx.name}\` = \`${obj.ctx.value.replaceAll(',', '')}\``,
				);
				entry.push('');
				entry.push(obj.description.summary);
				entry.push('');

				const returnType = obj.tags.find(
					(t) => t.tagType === 'type',
				).type;
				const typeURL = getTypeLink(returnType);
				const returnTypeStr = typeURL
					? `<code><a href="${typeURL}">${returnType}</a></code>`
					: '`' + returnType + '`';

				entry.push(`Type: ${returnTypeStr}`);
				continue;
			}
			//#endregion

			// context of the code block: is it a method, a function, a variable
			// if it doesn't match some regex, ctx is not available?
			if (!('ctx' in obj)) {
				// console.log(`Skipping '${obj.type}' in ${currentFile} (1)`, obj);
				continue;
			} else if (obj.ctx === false) {
				// console.log(`Skipping a block in ${currentFile} (2)`, obj);
				continue;
			}

			if (obj.ctx.type === 'property') {
				if (props.length === 0) {
					props.push('## Properties');
				}

				// Append a newline before
				if (props[props.length] !== '') {
					props.push('');
				}

				// getters and setters SHOULD be defined next to each other
				if (obj.code.startsWith('get ')) {
					props.push(`### ${obj.ctx.name}<Badge text="getter" />`);

					const nextObj = ast[i + 1];
					// ensure the next ctx is a setter for this property
					if (
						nextObj?.code?.startsWith('set ') &&
						nextObj?.ctx?.type !== 'method' &&
						nextObj?.ctx?.type === 'property' &&
						nextObj?.ctx?.name === obj.ctx.name
					) {
						props[props.length - 1] += '<Badge text="setter" />';
						// Skip the next tag since we peeked ahead
						++i;
					}
				} else {
					props.push(`### ${obj.ctx.name}`);
				}
				props.push(obj.description.summary);

				if (
					obj.tags?.[0]?.tagType === 'returns' ||
					obj.tags?.[0]?.tagType === 'type'
				) {
					const returnType = obj.tags[0].type;
					props.push('');
					props.push(`Type: ${getTypeString(returnType)}`);
				}
			} else if (obj.ctx.type === 'method') {
				if (methods.length === 0) {
					methods.push('## Methods');
				}

				// Append a newline before
				if (methods[methods.length] !== '') {
					methods.push('');
				}

				methods.push(`### ${obj.ctx.name}`);
				if (obj.tags.some((t) => t.tagType === 'static')) {
					methods[methods.length - 1] += '<Badge text="static" />';
				}

				if (obj.description.summary) {
					methods.push(obj.description.summary);
				}

				const returnTag = obj.tags.find((t) => t.tagType === 'returns');

				const params = obj.tags.filter((t) => t.tagType === 'param');
				if (params.length > 0) {
					const hasOptionalParams = params.some((t) => t.isOptional);
					const hasOptionalParamDefaultValue = params.some(
						(t) => t.isOptional && t.defaultValue,
					);

					if (hasOptionalParamDefaultValue) {
						methods.push(
							'| Parameter | Type | Optional | Default | Description |',
						);
						methods.push(
							'---------- | ---- | -------- | ------- | ----------- |',
						);
					} else if (hasOptionalParams) {
						methods.push(
							'| Parameter | Type | Optional | Description |',
						);
						methods.push(
							'| --------- | ---- | -------- | ----------- |',
						);
					} else {
						methods.push('| Parameter | Type | Description |');
						methods.push('| --------- | ---- | ----------- |');
					}

					for (const param of params) {
						const p_name = param.name;
						const p_type_og = param.type.trim();
						let p_type = p_type_og;
						if (p_type_og.includes('|')) {
							p_type = p_type_og
								.split('|')
								.map((t) => getTypeString(t.trim()))
								.join('\\|');
						} else {
							p_type = getTypeString(p_type_og);
						}
						const p_optional = param.isOptional;
						let p_defaultValue = param.defaultValue ?? '';
						if (
							hasOptionalParamDefaultValue &&
							param.defaultValue?.length > 0 &&
							param.type === 'string'
						) {
							p_defaultValue = `"${p_defaultValue}"`;
						}
						const p_description = param.description ?? '';

						if (hasOptionalParamDefaultValue) {
							methods.push(
								`| ${p_name} | ${p_type} | ${p_optional ? '✅' : ''} | ${p_defaultValue} | ${p_description} |`,
							);
						} else if (hasOptionalParams) {
							methods.push(
								`| ${p_name} | ${p_type} | ${p_optional ? '✅' : ''} | ${p_description} |`,
							);
						} else {
							methods.push(
								`| ${p_name} | ${p_type} | ${p_description} |`,
							);
						}
					}
				}

				methods.push('');
				methods.push(`**Returns:** ${getTypeString(returnTag.type)}`);
				if (returnTag.description) {
					methods.push('');
					methods.push(returnTag.description);
				}
			}
		}

		// Write the file
		let outPath;

		if (input.path.endsWith('struct')) {
			outPath = join(outputDir, 'struct');
		} else {
			outPath = join(outputDir);
		}
		outPath = join(outPath, `${title.toLowerCase()}.md`);

		await fs.ensureFile(outPath);

		let outStr = md.join('\n');
		if (props.length > 1) {
			outStr += `\n\n${props.join('\n')}`;
		}
		if (methods.length > 1) {
			outStr += `\n\n${methods.join('\n')}`;
		}
		outStr += '\n';

		await fs.writeFile(outPath, outStr);
	}

	console.log('');

	if (Object.keys(enums).length > 0) {
		console.log(`Found ${Object.keys(enums).length} enums to write...`);

		for (const [enumName, enumValues] of Object.entries(enums)) {
			console.log(`Writing enum ${enumName}`);
			const enumPath = join(
				outputDir,
				'enums',
				`${enumName.toLowerCase()}.md`,
			);
			await fs.ensureFile(enumPath);
			await fs.writeFile(enumPath, enumValues.join('\n'));
		}
	}

	console.log('');

	if (Object.keys(typedefs).length > 0) {
		console.log(`Found ${Object.keys(typedefs).length} typedefs to write`);

		for (const [typedefName, typedefValues] of Object.entries(typedefs)) {
			console.log(`Writing typedef ${typedefName}`);
			const typedefPath = join(
				outputDir,
				'typedefs',
				`${typedefName.toLowerCase()}.md`,
			);
			await fs.ensureFile(typedefPath);
			await fs.writeFile(typedefPath, typedefValues.join('\n'));
		}
	}
}

(async () => {
	const now = performance.now();
	let success = false;
	try {
		await parseForJSDoc();
		success = true;
	} catch (error) {
		console.log(
			`An error occured while parsing ${currentFile ?? 'code'} for jsdoc:`,
		);
		console.log(error);
	} finally {
		console.log('');
		console.log(
			`Parse ${success ? 'was successful' : 'failed'}, took ${Math.floor(performance.now() - now)}ms`,
		);
	}
})();
